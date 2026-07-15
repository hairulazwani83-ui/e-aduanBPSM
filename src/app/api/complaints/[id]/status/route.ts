import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, logAudit, getClientIp, sanitizeString } from '@/lib/security'
import { toComplaintStatus, serializeComplaint, fromComplaintStatus } from '@/lib/enum-converters'

// PATCH: Update complaint status or assign technician
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(['admin', 'technician'])
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const { status, assignedTo, note } = body

    const complaint = await db.complaint.findUnique({ where: { id } })
    if (!complaint) {
      return NextResponse.json({ error: 'Tiket tidak dijumpai.' }, { status: 404 })
    }

    const userRole = user!.role as string
    // RBAC: technicians can only update tickets assigned to them
    if (userRole === 'technician' && complaint.assignedTo !== user!.id) {
      return NextResponse.json({ error: 'Anda tidak ditugaskan untuk tiket ini.' }, { status: 403 })
    }

    // Validate status transition
    if (status) {
      const validStatuses = ['Baru', 'Ditugaskan', 'Dalam Tindakan', 'On Hold', 'Selesai', 'Ditutup']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Status tidak sah.' }, { status: 400 })
      }
    }

    // Only admins can assign technicians
    if (assignedTo !== undefined && userRole !== 'admin') {
      return NextResponse.json({ error: 'Hanya Admin boleh menugaskan juruteknik.' }, { status: 403 })
    }

    const updateData: any = {}
    if (status) {
      updateData.status = toComplaintStatus(status)
      if (status === 'Selesai') updateData.resolvedAt = new Date()
      if (status === 'Ditutup') updateData.closedAt = new Date()
    }
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo || null
      if (assignedTo && !complaint.assignedTo) updateData.assignedAt = new Date()
      // Set status to Ditugaskan when assigning
      if (assignedTo && complaint.status === ('BARU' as any)) {
        updateData.status = 'DITUGASKAN' as any
      }
    }

    const updated = await db.complaint.update({
      where: { id },
      data: updateData,
      include: {
        equipmentType: true,
        damageCategory: true,
        reporter: { select: { id: true, fullName: true, email: true } },
        technician: { select: { id: true, fullName: true } },
      },
    })

    // Record status history if status changed
    const currentStatusStr = fromComplaintStatus(complaint.status)
    if (status && status !== currentStatusStr) {
      await db.statusHistory.create({
        data: {
          complaintId: id,
          oldStatus: currentStatusStr,
          newStatus: status,
          changedById: user!.id,
          note: note ? sanitizeString(note, 500) : null,
        },
      })

      // Notify reporter
      await db.notification.create({
        data: {
          userId: complaint.reporterId,
          title: 'Status Tiket Dikemas Kini',
          message: `Tiket ${complaint.ticketNo}: Status bertukar kepada "${status}"`,
          type: status === 'Selesai' ? 'SUCCESS' as any : status === 'On Hold' ? 'WARNING' as any : 'INFO' as any,
          link: `/complaint/${id}`,
        },
      })
    }

    if (assignedTo && assignedTo !== complaint.assignedTo) {
      // Notify assigned technician
      await db.notification.create({
        data: {
          userId: assignedTo,
          title: 'Tugasan Tiket Baharu',
          message: `Anda telah ditugaskan untuk ${complaint.ticketNo}`,
          type: 'INFO' as any,
          link: `/complaint/${id}`,
        },
      })
    }

    await logAudit({
      userId: user!.id,
      action: 'UPDATE_COMPLAINT_STATUS',
      entity: 'complaint',
      entityId: id,
      details: `Tiket ${complaint.ticketNo}: status ${currentStatusStr} → ${status || '(unchanged)'}${assignedTo ? `, assigned to ${assignedTo}` : ''}`,
      ipAddress: getClientIp(req),
      severity: 'info',
    })

    return NextResponse.json({ success: true, complaint: serializeComplaint(updated) })
  } catch (e: any) {
    console.error('PATCH /api/complaints/[id]/status error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}
