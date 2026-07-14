import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/security'

// GET monthly report data (used by frontend to render report and PDF)
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin', 'management'])
    if (error) return error

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // YYYY-MM
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    let startDate: Date
    let endDate: Date

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr)
      endDate = new Date(endDateStr)
      endDate.setHours(23, 59, 59, 999)
    } else if (month) {
      const [y, m] = month.split('-').map(Number)
      startDate = new Date(y, m - 1, 1)
      endDate = new Date(y, m, 1)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    }

    const [
      complaints,
      workLogs,
      totalComplaints,
      totalCost,
      resolvedCount,
      closedCount,
      newCount,
      inProgressCount,
      onHoldCount,
    ] = await Promise.all([
      db.complaint.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: {
          equipmentType: true,
          damageCategory: true,
          asset: true,
          reporter: { select: { fullName: true, department: true, staffId: true } },
          technician: { select: { fullName: true } },
          workLogs: { include: { technician: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      db.workLog.findMany({
        where: { loggedAt: { gte: startDate, lte: endDate } },
        include: {
          complaint: { select: { ticketNo: true, location: true } },
          technician: { select: { fullName: true } },
        },
        orderBy: { loggedAt: 'asc' },
      }),
      db.complaint.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      db.workLog.aggregate({
        where: { loggedAt: { gte: startDate, lte: endDate } },
        _sum: { cost: true },
      }),
      db.complaint.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: 'Selesai' } }),
      db.complaint.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: 'Ditutup' } }),
      db.complaint.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: 'Baru' } }),
      db.complaint.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: { in: ['Ditugaskan', 'Dalam Tindakan'] } } }),
      db.complaint.count({ where: { createdAt: { gte: startDate, lte: endDate }, status: 'On Hold' } }),
    ])

    // Calculate avg resolution time
    const resolved = complaints.filter((c) => c.resolvedAt)
    let avgResHrs = 0
    if (resolved.length > 0) {
      const total = resolved.reduce((sum, c) => sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60), 0)
      avgResHrs = total / resolved.length
    }

    // Group by equipment type
    const byEquipment: Record<string, { count: number; cost: number }> = {}
    const byDamage: Record<string, number> = {}
    const byLocation: Record<string, number> = {}
    const byPriority: Record<string, number> = {}
    complaints.forEach((c) => {
      const eq = c.equipmentType.name
      byEquipment[eq] = byEquipment[eq] || { count: 0, cost: 0 }
      byEquipment[eq].count++
      byEquipment[eq].cost += c.workLogs.reduce((s, w) => s + w.cost, 0)
      byDamage[c.damageCategory.name] = (byDamage[c.damageCategory.name] || 0) + 1
      byLocation[c.location] = (byLocation[c.location] || 0) + 1
      byPriority[c.priority] = (byPriority[c.priority] || 0) + 1
    })

    return NextResponse.json({
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        label: startDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }),
      },
      summary: {
        totalComplaints,
        newCount,
        inProgressCount,
        onHoldCount,
        resolvedCount,
        closedCount,
        totalCost: totalCost._sum.cost || 0,
        avgResolutionHours: Math.round(avgResHrs * 10) / 10,
      },
      byEquipment: Object.entries(byEquipment).map(([name, v]) => ({ name, count: v.count, cost: v.cost })),
      byDamage: Object.entries(byDamage).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      byLocation: Object.entries(byLocation).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      byPriority: Object.entries(byPriority).map(([name, count]) => ({ name, count })),
      complaints,
      workLogs,
    })
  } catch (e: any) {
    console.error('GET /api/reports/monthly error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}
