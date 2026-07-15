import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit } from '@/lib/security'
import { db } from '@/lib/db'

// POST: AI monthly summary for dashboard
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth(['admin', 'management'])
    if (error) return error

    const rl = rateLimit(`ai-summary:${user!.id}`, 5, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Had kadar dicapai.' }, { status: 429 })
    }

    const body = await req.json()
    const { month } = body // YYYY-MM format

    let startDate: Date
    let endDate: Date
    if (month) {
      const [y, m] = month.split('-').map(Number)
      startDate = new Date(y, m - 1, 1)
      endDate = new Date(y, m, 1)
    } else {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      endDate = new Date()
    }

    const [complaints, workLogs, prevComplaints] = await Promise.all([
      db.complaint.findMany({
        where: { createdAt: { gte: startDate, lt: endDate } },
        include: {
          equipmentType: true,
          damageCategory: true,
        },
      }),
      db.workLog.findMany({
        where: { loggedAt: { gte: startDate, lt: endDate } },
        select: { cost: true },
      }),
      db.complaint.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1),
            lt: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
          },
        },
      }),
    ])

    const totalCost = workLogs.reduce((sum, w) => sum + Number(w.cost), 0)
    const byCat: Record<string, number> = {}
    const byLoc: Record<string, number> = {}
    complaints.forEach((c) => {
      const cn = c.damageCategory.name
      byCat[cn] = (byCat[cn] || 0) + 1
      byLoc[c.location] = (byLoc[c.location] || 0) + 1
    })
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
    const topLoc = Object.entries(byLoc).sort((a, b) => b[1] - a[1])[0]
    const pctChange = prevComplaints > 0 ? Math.round(((complaints.length - prevComplaints) / prevComplaints) * 100) : 0
    const totalCostNum = Number(totalCost)

    const summaryData = `Bulan: ${startDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}
Bilangan aduan: ${complaints.length} (${pctChange >= 0 ? '+' : ''}${pctChange}% berbanding bulan lepas)
Kategori paling banyak: ${topCat ? topCat[0] + ' (' + topCat[1] + ' kes)' : 'Tiada'}
Lokasi paling bermasalah: ${topLoc ? topLoc[0] + ' (' + topLoc[1] + ' kes)' : 'Tiada'}
Jumlah kos penyelenggaraan: RM${totalCostNum.toFixed(2)}`

    const prompt = `Anda adalah asisten AI untuk Unit ICT ADTEC JTM. Berdasarkan data statistik berikut, jana ringkasan naratif pendek (3-5 ayat) dalam Bahasa Melayu yang menyerlahkan trend utama, perbandingan dengan bulan lepas, dan cadangan tindakan. Gunakan format profesional untuk laporan pengurusan.

${summaryData}`

    try {
      const { ZAI } = await import('z-ai-web-dev-sdk')
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Anda adalah penulis laporan analitik teknikal yang profesional.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 400,
      })

      const text = completion.choices?.[0]?.message?.content || summaryData

      return NextResponse.json({
        success: true,
        summary: text,
        stats: {
          month: startDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }),
          total: complaints.length,
          pctChange,
          topCategory: topCat ? topCat[0] : null,
          topLocation: topLoc ? topLoc[0] : null,
          totalCost: totalCostNum,
        },
      })
    } catch (aiErr) {
      console.error('AI summary error:', aiErr)
      // Fallback template
      const fallback = `Pada ${startDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' })}, sebanyak ${complaints.length} aduan kerosakan ICT diterima${pctChange !== 0 ? `, ${pctChange > 0 ? 'meningkat' : 'menurun'} ${Math.abs(pctChange)}% berbanding bulan lepas` : ''}. ${topCat ? `Kategori kerosakan paling tinggi ialah ${topCat[0]} dengan ${topCat[1]} kes.` : ''} ${topLoc ? `Lokasi paling banyak melaporkan kerosakan ialah ${topLoc[0]} (${topLoc[1]} kes).` : ''} Jumlah kos penyelenggaraan kendiri bulan ini ialah RM${totalCostNum.toFixed(2)}. Cadangan: tumpukan sumber pemantauan dan pencegahan kepada kategori dan lokasi yang paling kritikal untuk mengurangkan aduan pada bulan akan datang.`

      return NextResponse.json({
        success: true,
        summary: fallback,
        stats: {
          month: startDate.toLocaleDateString('ms-MY', { month: 'long', year: 'numeric' }),
          total: complaints.length,
          pctChange,
          topCategory: topCat ? topCat[0] : null,
          topLocation: topLoc ? topLoc[0] : null,
          totalCost: totalCostNum,
        },
      })
    }
  } catch (e: any) {
    console.error('POST /api/ai/summary error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}
