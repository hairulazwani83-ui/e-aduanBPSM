import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'

// GET single complaint by id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { id } = await params
    const complaint = await db.complaint.findUnique({
      where: { id },
      include: {
        equipmentType: true,
        damageCategory: true,
        asset: true,
        reporter: { select: { id: true, fullName: true, email: true, department: true, phone: true, staffId: true } },
        technician: { select: { id: true, fullName: true, email: true } },
        workLogs: {
          include: { technician: { select: { id: true, fullName: true } } },
          orderBy: { loggedAt: 'desc' },
        },
        statusHistory: {
          include: { changedBy: { select: { id: true, fullName: true, role: true } } },
          orderBy: { changedAt: 'asc' },
        },
        ratings: { include: { user: { select: { id: true, fullName: true } } } },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Tiket tidak dijumpai.' }, { status: 404 })
    }

    // RBAC check
    if (user!.role === 'reporter' && complaint.reporterId !== user!.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
    }
    if (user!.role === 'technician' && complaint.assignedTo !== user!.id && complaint.reporterId !== user!.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
    }

    return NextResponse.json({ complaint })
  } catch (e: any) {
    console.error('GET /api/complaints/[id] error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
