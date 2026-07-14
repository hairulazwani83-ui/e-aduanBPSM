import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'

// GET users (admin/management)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin', 'management'])
    if (error) return error

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const department = searchParams.get('department')
    const search = searchParams.get('search')

    const where: any = {}
    if (role) where.role = role
    if (department) where.department = department
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { staffId: { contains: search } },
        { department: { contains: search } },
      ]
    }

    const users = await db.profile.findMany({
      where,
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
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    return NextResponse.json({ users })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// PATCH update user role/status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const body = await req.json()
    const { id, role, isActive, department, phone } = body

    if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 })
    if (id === user!.id && isActive === false) {
      return NextResponse.json({ error: 'Anda tidak boleh nyahaktifkan akaun sendiri.' }, { status: 400 })
    }

    const validRoles = ['reporter', 'technician', 'admin', 'management']
    const update: any = {}
    if (role !== undefined && validRoles.includes(role)) update.role = role
    if (isActive !== undefined) update.isActive = !!isActive
    if (department !== undefined) update.department = sanitizeString(department, 100)
    if (phone !== undefined) update.phone = sanitizeString(phone, 20)

    const updated = await db.profile.update({
      where: { id },
      data: update,
      select: { id: true, email: true, fullName: true, staffId: true, department: true, phone: true, role: true, isActive: true },
    })

    await logAudit({
      userId: user!.id,
      action: 'UPDATE_USER',
      entity: 'profile',
      entityId: id,
      details: `Kemas kini pengguna ${updated.email}: ${JSON.stringify(update)}`,
      ipAddress: getClientIp(req),
      severity: 'warning',
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
