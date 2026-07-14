import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security'

// GET: Dashboard statistics - aggregated data
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin', 'management', 'technician'])
    if (error) return error

    const { searchParams } = new URL(req.url)
    const monthsBack = parseInt(searchParams.get('months') || '6', 10)

    const now = new Date()
    const startRange = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)

    // Base filter
    const baseFilter: any = { createdAt: { gte: startRange } }

    // For technicians, filter to their assigned
    if (user!.role === 'technician') {
      baseFilter.OR = [{ assignedTo: user!.id }, { reporterId: user!.id }]
    }

    const [
      totalComplaints,
      newComplaints,
      inProgress,
      resolved,
      closed,
      onHold,
      totalWorkLogs,
      totalCost,
      totalAssets,
      activeAssets,
      damagedAssets,
      totalUsers,
      totalReporters,
      totalTechnicians,
      avgResolutionHours,
      recentComplaints,
      monthlyData,
      complaintsByEquipment,
      complaintsByDamage,
      complaintsByLocation,
      topDamageTypes,
      priorityBreakdown,
      ratingAvg,
    ] = await Promise.all([
      db.complaint.count({ where: baseFilter }),
      db.complaint.count({ where: { ...baseFilter, status: 'Baru' } }),
      db.complaint.count({ where: { ...baseFilter, status: { in: ['Ditugaskan', 'Dalam Tindakan'] } } }),
      db.complaint.count({ where: { ...baseFilter, status: 'Selesai' } }),
      db.complaint.count({ where: { ...baseFilter, status: 'Ditutup' } }),
      db.complaint.count({ where: { ...baseFilter, status: 'On Hold' } }),
      db.workLog.count(),
      db.workLog.aggregate({ _sum: { cost: true } }),
      db.asset.count(),
      db.asset.count({ where: { status: 'Aktif' } }),
      db.asset.count({ where: { status: 'Rosak' } }),
      db.profile.count({ where: { isActive: true } }),
      db.profile.count({ where: { role: 'reporter', isActive: true } }),
      db.profile.count({ where: { role: 'technician', isActive: true } }),
      // Avg resolution time (placeholder, computed below)
      Promise.resolve(null),
      // Recent 10 complaints
      db.complaint.findMany({
        where: user!.role === 'technician' ? { OR: [{ assignedTo: user!.id }, { reporterId: user!.id }] } : undefined,
        include: {
          equipmentType: true,
          damageCategory: true,
          reporter: { select: { fullName: true, department: true } },
          technician: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Monthly data
      db.complaint.findMany({
        where: baseFilter,
        select: { status: true, createdAt: true, resolvedAt: true, priority: true },
      }),
      // By equipment type
      db.complaint.groupBy({
        by: ['equipmentTypeId'],
        where: baseFilter,
        _count: true,
      }),
      // By damage category
      db.complaint.groupBy({
        by: ['damageCategoryId'],
        where: baseFilter,
        _count: true,
      }),
      // By location (top 8)
      db.complaint.groupBy({
        by: ['location'],
        where: baseFilter,
        _count: true,
        orderBy: { _count: { location: 'desc' } },
        take: 8,
      }),
      // Top damage types
      db.complaint.groupBy({
        by: ['damageCategoryId'],
        where: { ...baseFilter, status: { in: ['Selesai', 'Ditutup'] } },
        _count: true,
        orderBy: { _count: { damageCategoryId: 'desc' } },
        take: 5,
      }),
      // By priority
      db.complaint.groupBy({
        by: ['priority'],
        where: baseFilter,
        _count: true,
      }),
      // Avg rating
      db.complaint.aggregate({
        where: { ...baseFilter, reporterRating: { not: null } },
        _avg: { reporterRating: true },
      }),
    ])

    // Calculate avg resolution time manually (SQLite doesn't support date_diff in aggregate)
    const resolvedComplaints = await db.complaint.findMany({
      where: { ...baseFilter, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    })
    let avgResolutionHrs = 0
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, c) => {
        const hrs = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60)
        return sum + hrs
      }, 0)
      avgResolutionHrs = totalHours / resolvedComplaints.length
    }

    // Compute monthly chart data
    const monthlyChart: { month: string; label: string; baru: number; selesai: number }[] = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = mStart.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' })
      const inMonth = monthlyData.filter((c) => c.createdAt >= mStart && c.createdAt < mEnd)
      const resolvedInMonth = monthlyData.filter((c) => c.resolvedAt && c.resolvedAt >= mStart && c.resolvedAt < mEnd)
      monthlyChart.push({
        month: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`,
        label,
        baru: inMonth.length,
        selesai: resolvedInMonth.length,
      })
    }

    // Resolve equipment type names
    const eqTypes = await db.equipmentType.findMany()
    const eqMap = Object.fromEntries(eqTypes.map((e) => [e.id, e]))
    const byEquipment = complaintsByEquipment.map((e) => ({
      name: eqMap[e.equipmentTypeId]?.name || 'Tidak diketahui',
      code: eqMap[e.equipmentTypeId]?.code || '?',
      count: e._count,
    }))

    // Resolve damage category names
    const dmgCats = await db.damageCategory.findMany()
    const dmgMap = Object.fromEntries(dmgCats.map((c) => [c.id, c]))
    const byDamage = complaintsByDamage.map((c) => ({
      name: dmgMap[c.damageCategoryId]?.name || 'Tidak diketahui',
      count: c._count,
    }))
    const topDamages = topDamageTypes.map((c) => ({
      name: dmgMap[c.damageCategoryId]?.name || 'Tidak diketahui',
      count: c._count,
    }))

    // Cost by month
    const workLogs = await db.workLog.findMany({
      where: { loggedAt: { gte: startRange } },
      select: { cost: true, loggedAt: true },
    })
    const costByMonth: { month: string; label: string; total: number }[] = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = mStart.toLocaleDateString('ms-MY', { month: 'short', year: 'numeric' })
      const total = workLogs
        .filter((w) => w.loggedAt >= mStart && w.loggedAt < mEnd)
        .reduce((sum, w) => sum + w.cost, 0)
      costByMonth.push({
        month: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`,
        label,
        total: Math.round(total * 100) / 100,
      })
    }

    return NextResponse.json({
      summary: {
        totalComplaints,
        newComplaints,
        inProgress,
        resolved,
        closed,
        onHold,
        totalWorkLogs,
        totalCost: totalCost._sum.cost || 0,
        totalAssets,
        activeAssets,
        damagedAssets,
        totalUsers,
        totalReporters,
        totalTechnicians,
        avgResolutionHours: Math.round(avgResolutionHrs * 10) / 10,
        avgRating: ratingAvg._avg.reporterRating || 0,
        slaCompliance: totalComplaints > 0 ? Math.round(((resolved + closed) / totalComplaints) * 100) : 0,
      },
      recentComplaints,
      monthlyChart,
      costByMonth,
      byEquipment,
      byDamage,
      topDamages,
      byLocation: complaintsByLocation.map((c) => ({ name: c.location, count: c._count })),
      priorityBreakdown: priorityBreakdown.map((p) => ({ name: p.priority, count: p._count })),
    })
  } catch (e: any) {
    console.error('GET /api/dashboard/stats error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}
