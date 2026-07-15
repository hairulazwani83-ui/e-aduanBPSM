import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/security'
import { db } from '@/lib/db'
import { fromRole } from '@/lib/enum-converters'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Fetch fresh profile from DB
    const profile = await db.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        staffId: true,
        department: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Get unread notifications count
    const unreadCount = await db.notification.count({
      where: { userId: user.id, isRead: false },
    })

    return NextResponse.json({
      user: {
        ...profile,
        role: fromRole(profile.role),
        unreadCount,
      },
    })
  } catch (e) {
    console.error('GET /api/me error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
