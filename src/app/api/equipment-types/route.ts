import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString } from '@/lib/security'

// GET all equipment types
export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const types = await db.equipmentType.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { assets: true, complaints: true } } },
    })

    return NextResponse.json({ equipmentTypes: types })
  } catch (e: any) {
    console.error('GET /api/equipment-types error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// POST: Create new equipment type (admin only)
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const body = await req.json()
    const { code, name, icon } = body

    if (!code || !name) {
      return NextResponse.json({ error: 'Kod dan nama diperlukan.' }, { status: 400 })
    }

    const existing = await db.equipmentType.findFirst({
      where: { OR: [{ code: code.toUpperCase() }, { name }] },
    })
    if (existing) {
      return NextResponse.json({ error: 'Kod atau nama sudah wujud.' }, { status: 409 })
    }

    const type = await db.equipmentType.create({
      data: {
        code: sanitizeString(code.toUpperCase(), 20),
        name: sanitizeString(name, 200),
        icon: icon ? sanitizeString(icon, 50) : 'Monitor',
      },
    })

    return NextResponse.json({ success: true, equipmentType: type })
  } catch (e: any) {
    console.error('POST /api/equipment-types error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// PATCH: Update equipment type (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const body = await req.json()
    const { id, name, icon, isActive } = body

    if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 })

    const updated = await db.equipmentType.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: sanitizeString(name, 200) } : {}),
        ...(icon !== undefined ? { icon: sanitizeString(icon, 50) } : {}),
        ...(isActive !== undefined ? { isActive: !!isActive } : {}),
      },
    })

    return NextResponse.json({ success: true, equipmentType: updated })
  } catch (e: any) {
    console.error('PATCH /api/equipment-types error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
