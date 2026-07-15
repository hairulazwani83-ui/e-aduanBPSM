import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString } from '@/lib/security'
import { toPriority, fromPriority } from '@/lib/enum-converters'

// GET
export async function GET() {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const cats = await db.damageCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { complaints: true } } },
    })
    // Serialize enum
    const serialized = cats.map((c) => ({
      ...c,
      defaultPriority: fromPriority(c.defaultPriority),
    }))
    return NextResponse.json({ damageCategories: serialized })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// POST (admin)
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const body = await req.json()
    const { name, description, defaultPriority } = body

    if (!name) return NextResponse.json({ error: 'Nama diperlukan.' }, { status: 400 })

    const validPriorities = ['Rendah', 'Sederhana', 'Tinggi', 'Kritikal']
    const priority = validPriorities.includes(defaultPriority) ? defaultPriority : 'Sederhana'

    const cat = await db.damageCategory.create({
      data: {
        name: sanitizeString(name, 200),
        description: description ? sanitizeString(description, 500) : null,
        defaultPriority: toPriority(priority),
      },
    })

    return NextResponse.json({
      success: true,
      damageCategory: { ...cat, defaultPriority: fromPriority(cat.defaultPriority) },
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// PATCH (admin)
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const body = await req.json()
    const { id, name, description, defaultPriority, isActive } = body

    if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 })

    const validPriorities = ['Rendah', 'Sederhana', 'Tinggi', 'Kritikal']
    const update: any = {}
    if (name !== undefined) update.name = sanitizeString(name, 200)
    if (description !== undefined) update.description = sanitizeString(description, 500)
    if (defaultPriority !== undefined && validPriorities.includes(defaultPriority)) update.defaultPriority = toPriority(defaultPriority)
    if (isActive !== undefined) update.isActive = !!isActive

    const updated = await db.damageCategory.update({ where: { id }, data: update })
    return NextResponse.json({
      success: true,
      damageCategory: { ...updated, defaultPriority: fromPriority(updated.defaultPriority) },
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
