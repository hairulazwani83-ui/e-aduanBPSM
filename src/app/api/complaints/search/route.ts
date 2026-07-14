import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security'

// GET: Search ticket by ticket number (public read - reporter can check status)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const ticketNo = searchParams.get('ticketNo')?.trim()

    if (!ticketNo) {
      return NextResponse.json({ error: 'Nombor tiket diperlukan.' }, { status: 400 })
    }

    const complaint = await db.complaint.findFirst({
      where: { ticketNo: { contains: ticketNo, mode: 'insensitive' } },
      include: {
        equipmentType: true,
        damageCategory: true,
        asset: true,
        reporter: { select: { fullName: true, department: true } },
        technician: { select: { fullName: true } },
        statusHistory: {
          include: { changedBy: { select: { fullName: true } } },
          orderBy: { changedAt: 'asc' },
        },
      },
    })

    if (!complaint) {
      return NextResponse.json({ error: 'Tiket tidak dijumpai.' }, { status: 404 })
    }

    // RBAC
    if (user!.role === 'reporter' && complaint.reporterId !== user!.id) {
      return NextResponse.json({ error: 'Anda tidak mempunyai akses kepada tiket ini.' }, { status: 403 })
    }

    return NextResponse.json({ complaint })
  } catch (e: any) {
    console.error('GET /api/complaints/search error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
