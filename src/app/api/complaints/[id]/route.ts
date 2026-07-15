import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security'
import { serializeComplaint } from '@/lib/enum-converters'

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
    const userRole = user!.role as string
    if (userRole === 'reporter' && complaint.reporterId !== user!.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
    }
    if (userRole === 'technician' && complaint.assignedTo !== user!.id && complaint.reporterId !== user!.id) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 })
    }

    // Serialize the reporter role too
    const serialized = {
      ...serializeComplaint(complaint),
      reporter: complaint.reporter ? { ...complaint.reporter, role: (complaint.reporter as any).role ? String((complaint.reporter as any).role).toLowerCase() : undefined } : complaint.reporter,
      technician: complaint.technician ? { ...complaint.technician, role: (complaint.technician as any).role ? String((complaint.technician as any).role).toLowerCase() : undefined } : complaint.technician,
      statusHistory: complaint.statusHistory.map((h: any) => ({
        ...h,
        changedBy: h.changedBy ? { ...h.changedBy, role: h.changedBy.role ? String(h.changedBy.role).toLowerCase() : h.changedBy.role } : h.changedBy,
      })),
    }

    return NextResponse.json({ complaint: serialized })
  } catch (e: any) {
    console.error('GET /api/complaints/[id] error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
