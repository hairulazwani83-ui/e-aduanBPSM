/**
 * NextAuth Configuration
 * Sistem eAduan Kerosakan ICT - ADTEC JTM
 * Security: bcrypt password hashing, JWT sessions, role-based access
 */
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/security'

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MIN = 15

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()
        const profile = await db.profile.findUnique({
          where: { email },
        })

        if (!profile) {
          await logAudit({
            action: 'LOGIN_FAILED',
            entity: 'auth',
            details: `Percubaan log masuk gagal - email tidak wujud: ${email}`,
            ipAddress: (req as any)?.headers?.['x-forwarded-for'] || 'unknown',
            severity: 'warning',
          })
          return null
        }

        // Account lock check
        if (profile.lockedUntil && profile.lockedUntil > new Date()) {
          await logAudit({
            userId: profile.id,
            action: 'LOGIN_LOCKED',
            entity: 'auth',
            details: 'Akaun dikunci sementara - terlalu banyak percubaan gagal',
            ipAddress: (req as any)?.headers?.['x-forwarded-for'] || 'unknown',
            severity: 'warning',
          })
          return null
        }

        // Active check
        if (!profile.isActive) {
          await logAudit({
            userId: profile.id,
            action: 'LOGIN_DISABLED',
            entity: 'auth',
            details: 'Akaun tidak aktif',
            ipAddress: (req as any)?.headers?.['x-forwarded-for'] || 'unknown',
            severity: 'warning',
          })
          return null
        }

        const valid = await bcrypt.compare(credentials.password, profile.passwordHash)

        if (!valid) {
          const attempts = profile.failedLoginAttempts + 1
          const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS
          await db.profile.update({
            where: { id: profile.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MIN * 60000) : null,
            },
          })
          await logAudit({
            userId: profile.id,
            action: 'LOGIN_FAILED',
            entity: 'auth',
            details: `Kata laluan salah (percubaan ${attempts}/${MAX_LOGIN_ATTEMPTS})${shouldLock ? ' - AKAUN DIKUNCI' : ''}`,
            ipAddress: (req as any)?.headers?.['x-forwarded-for'] || 'unknown',
            severity: shouldLock ? 'critical' : 'warning',
          })
          return null
        }

        // Success: reset counters, update lastLogin
        await db.profile.update({
          where: { id: profile.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        })

        await logAudit({
          userId: profile.id,
          action: 'LOGIN',
          entity: 'auth',
          details: 'Log masuk berjaya',
          ipAddress: (req as any)?.headers?.['x-forwarded-for'] || 'unknown',
          severity: 'info',
        })

        return {
          id: profile.id,
          email: profile.email,
          name: profile.fullName,
          role: profile.role,
          staffId: profile.staffId,
          department: profile.department,
        } as any
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
        token.staffId = (user as any).staffId
        token.department = (user as any).department
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).staffId = token.staffId
        ;(session.user as any).department = token.department
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'eaduan-jtm-secret-key-change-in-production-2026',
}

// Type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      staffId: string
      department: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    staffId: string
    department: string
  }
}
