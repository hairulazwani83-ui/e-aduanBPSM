import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, rateLimit, getClientIp } from '@/lib/security'
import { db } from '@/lib/db'

// POST: AI auto-classify complaint description
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error

    // Rate limit: 10 calls per minute per user
    const rl = rateLimit(`ai-classify:${user!.id}`, 10, 60000)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Had kadar dicapai. Sila tunggu sebentar sebelum mencuba lagi.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { description } = body

    if (!description || description.length < 5) {
      return NextResponse.json({ error: 'Penerangan terlalu pendek untuk dianalisis.' }, { status: 400 })
    }

    // Fetch available categories
    const categories = await db.damageCategory.findMany({
      where: { isActive: true },
      select: { name: true, description: true, defaultPriority: true },
    })

    const catList = categories.map((c) => `- ${c.name}: ${c.description}`).join('\n')

    const prompt = `Anda adalah asisten AI untuk Sistem eAduan Kerosakan ICT di ADTEC JTM Kampus Pasir Gudang. 
Berdasarkan penerangan kerosakan berikut, cadangkan:
1. Kategori kerosakan yang paling sesuai (pilih SATU dari senarai di bawah)
2. Tahap keutamaan (Rendah/Sederhana/Tinggi/Kritikal)
3. Cadangan penyelesaian awal (langkah troubleshooting asas)

SENARAI KATEGORI:
${catList}

PENERANGAN KEROSAKAN:
"${description}"

Jawab dalam format JSON sahaja:
{
  "category": "nama kategori",
  "priority": "Rendah/Sederhana/Tinggi/Kritikal",
  "solution": "cadangan penyelesaian ringkas (maksimum 3 ayat)"
}`

    try {
      // Dynamically import z-ai-web-dev-sdk (server-side only)
      const { ZAI } = await import('z-ai-web-dev-sdk')
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Anda adalah asisten AI teknikal yang membantu klasifikasi kerosakan ICT. Jawab dalam Bahasa Melayu.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })

      const text = completion.choices?.[0]?.message?.content || ''

      // Extract JSON from response
      let parsed: any = null
      try {
        // Try direct parse first
        parsed = JSON.parse(text)
      } catch {
        // Try to extract from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[1]) } catch {}
        }
        if (!parsed) {
          // Try to find JSON object in text
          const objMatch = text.match(/\{[\s\S]*\}/)
          if (objMatch) {
            try { parsed = JSON.parse(objMatch[0]) } catch {}
          }
        }
      }

      if (parsed && parsed.category) {
        return NextResponse.json({
          success: true,
          aiSuggestedCategory: parsed.category,
          aiSuggestedPriority: parsed.priority || 'Sederhana',
          aiSolution: parsed.solution || '',
          raw: text,
        })
      }

      // Fallback if parsing failed
      return NextResponse.json({
        success: true,
        aiSuggestedCategory: null,
        aiSuggestedPriority: 'Sederhana',
        aiSolution: text.slice(0, 500),
        raw: text,
      })
    } catch (aiErr: any) {
      console.error('AI SDK error:', aiErr)
      // Fallback: simple keyword matching
      const lowerDesc = description.toLowerCase()
      let fallbackCat = 'Lain-lain'
      let fallbackPriority = 'Sederhana'

      if (/printer|cetak|toner|dakwat|kertas/.test(lowerDesc)) {
        fallbackCat = 'Pencetakan (Printing)'
        fallbackPriority = 'Rendah'
      } else if (/wifi|internet|network|rangkaian|sambungan|ip/.test(lowerDesc)) {
        fallbackCat = 'Rangkaian (Network)'
        fallbackPriority = 'Tinggi'
      } else if (/projektor|display|monitor|paparan|layar/.test(lowerDesc)) {
        fallbackCat = 'Paparan (Display)'
        fallbackPriority = 'Sederhana'
      } else if (/crash|hang|virus|malware|software|windows|blue screen/.test(lowerDesc)) {
        fallbackCat = 'Perisian (Software)'
        fallbackPriority = 'Sederhana'
      } else if (/hidup|bunyi|rosak|port|kabel|hardware|perkakasan|bateri/.test(lowerDesc)) {
        fallbackCat = 'Perkakasan (Hardware)'
        fallbackPriority = 'Tinggi'
      }

      return NextResponse.json({
        success: true,
        aiSuggestedCategory: fallbackCat,
        aiSuggestedPriority: fallbackPriority,
        aiSolution: 'Sila semak sambungan kabel dan restart peranti terlebih dahulu. Jika masalah berterusan, log aduan untuk tindakan lanjut oleh Unit ICT.',
        raw: 'Fallback classification used (AI service unavailable)',
      })
    }
  } catch (e: any) {
    console.error('POST /api/ai/classify error:', e)
    return NextResponse.json({ error: 'Ralat pelayan: ' + e.message }, { status: 500 })
  }
}
