import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security'
import { Severity } from '@prisma/client'

// GET audit logs (admin only)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (severity) {
      const sevMap: Record<string, Severity> = {
        info: Severity.INFO,
        warning: Severity.WARNING,
        critical: Severity.CRITICAL,
      }
      if (sevMap[severity]) where.severity = sevMap[severity]
    }
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 500),
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ])

    // Serialize user role enum to lowercase string
    const serialized = logs.map((l) => ({
      ...l,
      severity: l.severity.toLowerCase(),
      user: l.user ? { ...l.user, role: String(l.user.role).toLowerCase() } : null,
    }))

    return NextResponse.json({ logs: serialized, total, limit, offset })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
