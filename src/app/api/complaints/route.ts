import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, sanitizeString, logAudit, getClientIp, Role } from '@/lib/security'

// POST: Create new complaint
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['reporter', 'technician', 'admin'])
    if (error) return error

    const body = await req.json()
    const { equipmentTypeId, assetId, damageCategoryId, description, priority, location, aiSuggestedCategory, aiSuggestedPriority, aiSolution, attachmentUrl } = body

    // Validate
    if (!equipmentTypeId || !damageCategoryId || !description || !location) {
      return NextResponse.json({ error: 'Medan wajib tidak diisi.' }, { status: 400 })
    }

    if (description.length < 10) {
      return NextResponse.json({ error: 'Penerangan kerosakan mesti sekurang-kurangnya 10 aksara.' }, { status: 400 })
    }

    // Validate equipment type exists and is active
    const eqType = await db.equipmentType.findFirst({
      where: { id: equipmentTypeId, isActive: true },
    })
    if (!eqType) {
      return NextResponse.json({ error: 'Jenis peralatan tidak sah.' }, { status: 400 })
    }

    const dmgCat = await db.damageCategory.findFirst({
      where: { id: damageCategoryId, isActive: true },
    })
    if (!dmgCat) {
      return NextResponse.json({ error: 'Kategori kerosakan tidak sah.' }, { status: 400 })
    }

    // Generate ticket number ADT-PG-YYYYMM-XXXX
    const now = new Date()
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const prefix = `ADT-PG-${yearMonth}-`

    // Find max sequence for this month
    const lastTicket = await db.complaint.findFirst({
      where: { ticketNo: { startsWith: prefix } },
      orderBy: { ticketNo: 'desc' },
    })

    let seq = 1
    if (lastTicket) {
      const lastSeq = parseInt(lastTicket.ticketNo.slice(-4), 10)
      seq = lastSeq + 1
    }

    const ticketNo = `${prefix}${String(seq).padStart(4, '0')}`

    // Sanitize
    const safeDesc = sanitizeString(description, 5000)
    const safeLoc = sanitizeString(location, 200)
    const safePriority = ['Rendah', 'Sederhana', 'Tinggi', 'Kritikal'].includes(priority) ? priority : 'Sederhana'

    const complaint = await db.complaint.create({
      data: {
        ticketNo,
        reporterId: user!.id,
        equipmentTypeId,
        assetId: assetId || null,
        damageCategoryId,
        description: safeDesc,
        aiSuggestedCategory: aiSuggestedCategory ? sanitizeString(aiSuggestedCategory, 200) : null,
        aiSuggestedPriority: aiSuggestedPriority ? sanitizeString(aiSuggestedPriority, 50) : null,
        aiSolution: aiSolution ? sanitizeString(aiSolution, 2000) : null,
        priority: safePriority,
        location: safeLoc,
        status: 'Baru',
        attachmentUrl: attachmentUrl ? sanitizeString(attachmentUrl, 500) : null,
      },
      include: {
        equipmentType: true,
        damageCategory: true,
        asset: true,
        reporter: { select: { id: true, fullName: true, email: true, department: true, phone: true } },
      },
    })

    // Initial status history
    await db.statusHistory.create({
      data: {
        complaintId: complaint.id,
        oldStatus: null,
        newStatus: 'Baru',
        changedById: user!.id,
        note: 'Aduan dicipta',
      },
    })

    // Create notification for admins
    const admins = await db.profile.findMany({ where: { role: 'admin', isActive: true } })
    await Promise.all(
      admins.map((a) =>
        db.notification.create({
          data: {
            userId: a.id,
            title: 'Aduan Baharu Diterima',
            message: `Tiket ${ticketNo}: ${safeDesc.slice(0, 80)}${safeDesc.length > 80 ? '...' : ''}`,
            type: 'info',
            link: `/complaint/${complaint.id}`,
          },
        })
      )
    )

    await logAudit({
      userId: user!.id,
      action: 'CREATE_COMPLAINT',
      entity: 'complaint',
      entityId: complaint.id,
      details: `Aduan baharu dicipta: ${ticketNo}`,
      ipAddress: getClientIp(req),
      severity: 'info',
    })

    return NextResponse.json({ success: true, complaint })
  } catch (e: any) {
    console.error('POST /api/complaints error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}

// GET: List complaints with filters
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const equipmentTypeId = searchParams.get('equipmentTypeId')
    const damageCategoryId = searchParams.get('damageCategoryId')
    const assignedTo = searchParams.get('assignedTo')
    const reporterId = searchParams.get('reporterId')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // RBAC: reporters only see their own
    const where: any = {}
    if (user!.role === 'reporter') {
      where.reporterId = user!.id
    } else if (user!.role === 'technician') {
      // Technicians see assigned + their own
      where.OR = [
        { assignedTo: user!.id },
        { reporterId: user!.id },
      ]
    }
    // admin and management see all

    if (status) where.status = status
    if (priority) where.priority = priority
    if (equipmentTypeId) where.equipmentTypeId = equipmentTypeId
    if (damageCategoryId) where.damageCategoryId = damageCategoryId
    if (assignedTo) where.assignedTo = assignedTo
    if (reporterId && (user!.role === 'admin' || user!.role === 'management')) where.reporterId = reporterId
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { ticketNo: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ]
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          equipmentType: true,
          damageCategory: true,
          asset: true,
          reporter: { select: { id: true, fullName: true, email: true, department: true, phone: true } },
          technician: { select: { id: true, fullName: true } },
          workLogs: { include: { technician: { select: { id: true, fullName: true } } }, orderBy: { loggedAt: 'desc' } },
          statusHistory: { include: { changedBy: { select: { id: true, fullName: true } } }, orderBy: { changedAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      db.complaint.count({ where }),
    ])

    return NextResponse.json({ complaints, total, limit, offset })
  } catch (e: any) {
    console.error('GET /api/complaints error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}
