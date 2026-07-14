/**
 * Security & RBAC utilities
 * Sistem eAduan Kerosakan ICT - ADTEC JTM
 */
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// ==================== Audit Logging ====================
export async function logAudit(params: {
  userId?: string | null
  action: string
  entity?: string
  entityId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  severity?: 'info' | 'warning' | 'critical'
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity || null,
        entityId: params.entityId || null,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        severity: params.severity || 'info',
      },
    })
  } catch (e) {
    console.error('Failed to log audit:', e)
  }
}

// ==================== Session helper ====================
export async function getSession() {
  return getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user) return null
  return session.user
}

// ==================== Role-based access control ====================
export type Role = 'reporter' | 'technician' | 'admin' | 'management'

const ROLE_HIERARCHY: Record<Role, number> = {
  reporter: 1,
  technician: 2,
  management: 3,
  admin: 4,
}

export function hasRole(userRole: string, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole as Role)
}

/**
 * Require user to be authenticated with one of the specified roles.
 * Returns the user if authorized, or a NextResponse error if not.
 */
export async function requireAuth(requiredRoles: Role[] = ['reporter', 'technician', 'admin', 'management']) {
  const user = await getCurrentUser()
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Tidak dibenarkan. Sila log masuk terlebih dahulu.' },
        { status: 401 }
      ),
    }
  }
  if (!requiredRoles.includes(user.role as Role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Akses ditolak. Anda tidak mempunyai kebenaran yang mencukupi.' },
        { status: 403 }
      ),
    }
  }
  return { user, error: null }
}

// ==================== Rate Limiting (in-memory) ====================
// Note: For production, use Redis or database-backed store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || record.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetMs: record.resetTime - now }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetMs: record.resetTime - now }
}

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

// ==================== Input Sanitization ====================
export function sanitizeString(input: string, maxLength: number = 5000): string {
  if (typeof input !== 'string') return ''
  return input.slice(0, maxLength).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  return /^[0-9+\-\s()]{7,20}$/.test(phone)
}

// Password policy: min 8 chars, must include uppercase, lowercase, digit
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: 'Kata laluan mesti sekurang-kurangnya 8 aksara' }
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Kata laluan mesti mengandungi huruf besar' }
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Kata laluan mesti mengandungi huruf kecil' }
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Kata laluan mesti mengandungi nombor' }
  return { valid: true }
}

// ==================== CSRF Token (for additional protection) ====================
export function generateCsrfToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
