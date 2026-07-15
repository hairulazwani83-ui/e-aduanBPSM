import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security'

// GET notifications for current user
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = { userId: user!.id }
    if (unreadOnly) where.isRead = false

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Serialize type enum
    const serialized = notifications.map((n) => ({ ...n, type: n.type.toLowerCase() }))

    return NextResponse.json({ notifications: serialized })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// PATCH mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const body = await req.json()
    const { id, markAllAsRead } = body

    if (markAllAsRead) {
      await db.notification.updateMany({
        where: { userId: user!.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, marked: 'all' })
    }

    if (id) {
      await db.notification.updateMany({
        where: { id, userId: user!.id },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, marked: id })
    }

    return NextResponse.json({ error: 'ID atau markAllAsRead diperlukan.' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
