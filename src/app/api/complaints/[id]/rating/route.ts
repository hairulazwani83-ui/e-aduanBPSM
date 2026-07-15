import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'
import { ComplaintStatus, Severity } from '@prisma/client'

// POST: Rate a resolved/closed complaint
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(['reporter', 'admin'])
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const { rating, feedback } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating mesti antara 1 hingga 5.' }, { status: 400 })
    }

    const complaint = await db.complaint.findUnique({ where: { id } })
    if (!complaint) {
      return NextResponse.json({ error: 'Tiket tidak dijumpai.' }, { status: 404 })
    }

    // Only the reporter can rate their own complaint
    if (complaint.reporterId !== user!.id) {
      return NextResponse.json({ error: 'Hanya pelapor asal boleh memberi rating.' }, { status: 403 })
    }

    // Check status (compare enum)
    if (![ComplaintStatus.SELESAI, ComplaintStatus.DITUTUP].includes(complaint.status)) {
      return NextResponse.json({ error: 'Tiket belum selesai. Tidak boleh rating lagi.' }, { status: 400 })
    }

    // Upsert rating
    const existing = await db.complaintRating.findUnique({
      where: { complaintId_userId: { complaintId: id, userId: user!.id } },
    })

    let ratingRecord
    if (existing) {
      ratingRecord = await db.complaintRating.update({
        where: { id: existing.id },
        data: { rating, feedback: feedback ? sanitizeString(feedback, 1000) : null },
      })
    } else {
      ratingRecord = await db.complaintRating.create({
        data: {
          complaintId: id,
          userId: user!.id,
          rating,
          feedback: feedback ? sanitizeString(feedback, 1000) : null,
        },
      })
    }

    // Also update complaint itself for quick access
    // Auto-close if status was Selesai
    const shouldClose = complaint.status === ComplaintStatus.SELESAI
    await db.complaint.update({
      where: { id },
      data: {
        reporterRating: rating,
        reporterFeedback: feedback ? sanitizeString(feedback, 1000) : null,
        ...(shouldClose ? { status: ComplaintStatus.DITUTUP, closedAt: new Date() } : {}),
      },
    })

    await logAudit({
      userId: user!.id,
      action: 'RATE_COMPLAINT',
      entity: 'complaint',
      entityId: id,
      details: `Rating ${rating}/5 diberikan untuk ${complaint.ticketNo}`,
      ipAddress: getClientIp(req),
      severity: Severity.INFO,
    })

    return NextResponse.json({ success: true, rating: ratingRecord })
  } catch (e: any) {
    console.error('POST /api/complaints/[id]/rating error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
