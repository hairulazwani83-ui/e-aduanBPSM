import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'
import { SuggestionStatus, NotificationType, Severity } from '@prisma/client'
import { serializeSuggestion } from '@/lib/enum-converters'

// PATCH: Admin responds to a suggestion
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const { adminResponse, status } = body

    if (!adminResponse) {
      return NextResponse.json({ error: 'Respons diperlukan.' }, { status: 400 })
    }

    const suggestion = await db.suggestion.findUnique({ where: { id } })
    if (!suggestion) {
      return NextResponse.json({ error: 'Cadangan tidak dijumpai.' }, { status: 404 })
    }

    const validStatuses: Record<string, SuggestionStatus> = {
      'Baru': SuggestionStatus.BARU,
      'Dalam Semakan': SuggestionStatus.DALAM_SEMAKAN,
      'Dijawab': SuggestionStatus.DIJAWAB,
    }
    const newStatus = (status && validStatuses[status]) || SuggestionStatus.DIJAWAB

    const updated = await db.suggestion.update({
      where: { id },
      data: {
        adminResponse: sanitizeString(adminResponse, 2000),
        status: newStatus,
        respondedAt: new Date(),
      },
      include: {
        submittedBy: { select: { id: true, fullName: true } },
      },
    })

    // Notify the submitter
    await db.notification.create({
      data: {
        userId: suggestion.submittedById,
        title: 'Cadangan Anda Telah Dijawab',
        message: `Cadangan "${suggestion.subject}" telah diberi respons oleh Admin.`,
        type: NotificationType.SUCCESS,
      },
    })

    await logAudit({
      userId: user!.id,
      action: 'RESPOND_SUGGESTION',
      entity: 'suggestion',
      entityId: id,
      details: `Respons kepada cadangan "${suggestion.subject}"`,
      ipAddress: getClientIp(req),
      severity: Severity.INFO,
    })

    return NextResponse.json({ success: true, suggestion: serializeSuggestion(updated) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
