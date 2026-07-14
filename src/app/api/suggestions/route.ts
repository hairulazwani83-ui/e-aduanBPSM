import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'

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
    if (status) where.status = status

    const suggestions = await db.suggestion.findMany({
      where,
      include: {
        submittedBy: { select: { id: true, fullName: true, department: true, staffId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ suggestions })
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

    const validCats = ['Umum', 'Peningkatan', 'Aduan Perkhidmatan']
    const cat = validCats.includes(category) ? category : 'Umum'

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
    const admins = await db.profile.findMany({ where: { role: 'admin', isActive: true } })
    await Promise.all(
      admins.map((a) =>
        db.notification.create({
          data: {
            userId: a.id,
            title: 'Cadangan/Syor Baharu',
            message: `${user!.name} menghantar cadangan: ${subject}`,
            type: 'info',
          },
        })
      )
    )

    return NextResponse.json({ success: true, suggestion })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
