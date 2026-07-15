import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'
import { SuggestionCategory, SuggestionStatus, NotificationType, Severity, Role } from '@prisma/client'
import { fromSuggestionCategory, fromSuggestionStatus, serializeSuggestion } from '@/lib/enum-converters'

// GET suggestions
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}
    // Reporters only see their own
    if (user!.role === 'reporter') {
      where.submittedById = user!.id
    }
    if (status) {
      const statusMap: Record<string, SuggestionStatus> = {
        'Baru': SuggestionStatus.BARU,
        'Dalam Semakan': SuggestionStatus.DALAM_SEMAKAN,
        'Dijawab': SuggestionStatus.DIJAWAB,
      }
      if (statusMap[status]) where.status = statusMap[status]
    }

    const suggestions = await db.suggestion.findMany({
      where,
      include: {
        submittedBy: { select: { id: true, fullName: true, department: true, staffId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ suggestions: suggestions.map(serializeSuggestion) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// POST new suggestion
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const body = await req.json()
    const { subject, message, category } = body

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subjek dan mesej diperlukan.' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Mesej mesti sekurang-kurangnya 10 aksara.' }, { status: 400 })
    }

    const validCats: Record<string, SuggestionCategory> = {
      'Umum': SuggestionCategory.UMUM,
      'Peningkatan': SuggestionCategory.PENINGKATAN,
      'Aduan Perkhidmatan': SuggestionCategory.ADUAN_PERKHIDMATAN,
    }
    const cat = validCats[category] || SuggestionCategory.UMUM

    const suggestion = await db.suggestion.create({
      data: {
        submittedById: user!.id,
        subject: sanitizeString(subject, 200),
        message: sanitizeString(message, 2000),
        category: cat,
      },
      include: {
        submittedBy: { select: { id: true, fullName: true, department: true } },
      },
    })

    // Notify admins
    const admins = await db.profile.findMany({ where: { role: Role.ADMIN, isActive: true } })
    await Promise.all(
      admins.map((a) =>
        db.notification.create({
          data: {
            userId: a.id,
            title: 'Cadangan/Syor Baharu',
            message: `${user!.name} menghantar cadangan: ${subject}`,
            type: NotificationType.INFO,
          },
        })
      )
    )

    return NextResponse.json({ success: true, suggestion: serializeSuggestion(suggestion) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
