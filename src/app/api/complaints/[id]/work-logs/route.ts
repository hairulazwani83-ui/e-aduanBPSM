import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'

// POST: Add work log entry (technician only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(['technician', 'admin'])
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const { actionTaken, cost, spareParts } = body

    if (!actionTaken || actionTaken.length < 5) {
      return NextResponse.json({ error: 'Tindakan mesti diterangkan dengan jelas.' }, { status: 400 })
    }

    const complaint = await db.complaint.findUnique({ where: { id } })
    if (!complaint) {
      return NextResponse.json({ error: 'Tiket tidak dijumpai.' }, { status: 404 })
    }

    // Only assigned technician or admin can add work logs
    if (user!.role === 'technician' && complaint.assignedTo !== user!.id) {
      return NextResponse.json({ error: 'Anda tidak ditugaskan untuk tiket ini.' }, { status: 403 })
    }

    const safeCost = typeof cost === 'number' && cost >= 0 ? Math.min(cost, 100000) : 0
    const safeAction = sanitizeString(actionTaken, 2000)
    const safeParts = spareParts ? sanitizeString(spareParts, 500) : null

    const workLog = await db.workLog.create({
      data: {
        complaintId: id,
        technicianId: user!.id,
        actionTaken: safeAction,
        cost: safeCost,
        spareParts: safeParts,
      },
      include: {
        technician: { select: { id: true, fullName: true } },
      },
    })

    await logAudit({
      userId: user!.id,
      action: 'CREATE_WORKLOG',
      entity: 'work_log',
      entityId: workLog.id,
      details: `Work log added to ${complaint.ticketNo}: RM${safeCost.toFixed(2)}`,
      ipAddress: getClientIp(req),
      severity: 'info',
    })

    return NextResponse.json({ success: true, workLog })
  } catch (e: any) {
    console.error('POST /api/complaints/[id]/work-logs error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
