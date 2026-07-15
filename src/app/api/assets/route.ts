import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp } from '@/lib/security'
import { toAssetStatus, fromAssetStatus, serializeAsset } from '@/lib/enum-converters'

// GET assets with optional filter
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const equipmentTypeId = searchParams.get('equipmentTypeId')
    const status = searchParams.get('status')
    const location = searchParams.get('location')
    const search = searchParams.get('search')

    const where: any = {}
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId
    if (status) where.status = toAssetStatus(status)
    if (location) where.location = { contains: location, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' } },
        { brandModel: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const assets = await db.asset.findMany({
      where,
      include: {
        equipmentType: true,
        _count: { select: { complaints: true } },
      },
      orderBy: { assetTag: 'asc' },
      take: 200,
    })

    return NextResponse.json({ assets: assets.map(serializeAsset) })
  } catch (e: any) {
    console.error('GET /api/assets error:', e)
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}

// POST (admin)
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin'])
    if (error) return error

    const body = await req.json()
    const { assetTag, equipmentTypeId, brandModel, location, purchaseDate, status, notes } = body

    if (!assetTag || !equipmentTypeId || !brandModel || !location) {
      return NextResponse.json({ error: 'Medan wajib: tag aset, jenis peralatan, jenama/model, lokasi' }, { status: 400 })
    }

    const existing = await db.asset.findUnique({ where: { assetTag } })
    if (existing) {
      return NextResponse.json({ error: 'Tag aset sudah wujud.' }, { status: 409 })
    }

    const eqType = await db.equipmentType.findUnique({ where: { id: equipmentTypeId } })
    if (!eqType) {
      return NextResponse.json({ error: 'Jenis peralatan tidak wujud.' }, { status: 400 })
    }

    const validStatus = ['Aktif', 'Rosak', 'Dilupus'].includes(status) ? status : 'Aktif'

    const asset = await db.asset.create({
      data: {
        assetTag: sanitizeString(assetTag, 50),
        equipmentTypeId,
        brandModel: sanitizeString(brandModel, 200),
        location: sanitizeString(location, 200),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        status: toAssetStatus(validStatus),
        notes: notes ? sanitizeString(notes, 500) : null,
      },
      include: { equipmentType: true },
    })

    await logAudit({
      userId: user!.id,
      action: 'CREATE_ASSET',
      entity: 'asset',
      entityId: asset.id,
      details: `Aset baharu: ${asset.assetTag} (${asset.brandModel})`,
      ipAddress: getClientIp(req),
      severity: 'info',
    })

    return NextResponse.json({ success: true, asset: serializeAsset(asset) })
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
    const { id, assetTag, equipmentTypeId, brandModel, location, purchaseDate, status, notes } = body

    if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 })

    const update: any = {}
    if (assetTag !== undefined) update.assetTag = sanitizeString(assetTag, 50)
    if (equipmentTypeId !== undefined) update.equipmentTypeId = equipmentTypeId
    if (brandModel !== undefined) update.brandModel = sanitizeString(brandModel, 200)
    if (location !== undefined) update.location = sanitizeString(location, 200)
    if (purchaseDate !== undefined) update.purchaseDate = purchaseDate ? new Date(purchaseDate) : null
    if (status !== undefined && ['Aktif', 'Rosak', 'Dilupus'].includes(status)) update.status = toAssetStatus(status)
    if (notes !== undefined) update.notes = notes ? sanitizeString(notes, 500) : null

    const updated = await db.asset.update({ where: { id }, data: update, include: { equipmentType: true } })
    return NextResponse.json({ success: true, asset: serializeAsset(updated) })
  } catch (e: any) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 })
  }
}
