'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusCircle, ChevronRight, ChevronLeft, Send, Sparkles, Loader2,
  Monitor, Laptop, Printer, Projector, Network, Router, Wifi, CheckCircle2,
  Upload, X, AlertCircle, MapPin, Cpu,
} from 'lucide-react'
import { toast } from 'sonner'
import { PriorityBadge } from '@/components/shared/Glass'

const ICON_MAP: Record<string, any> = {
  Monitor, Laptop, Printer, Projector, Network, Router, Wifi,
}

const LOCATIONS = [
  'Blok A - Bilik Kuliah 1', 'Blok A - Bilik Kuliah 2', 'Blok A - Makmal Komputer 1', 'Blok A - Makmal Komputer 2',
  'Blok B - Bengkel Elektrik', 'Blok B - Bengkel Elektronik', 'Blok B - Bengkel Mekanikal',
  'Blok C - Pejabat Pentadbiran', 'Blok C - Bilik Staf',
  'Blok D - Perpustakaan', 'Blok D - Bilik Pensyarah',
  'Blok E - Makmal Rangkaian', 'Blok E - Pusat Komputer',
  'Auditorium', 'Surau', 'Kafeteria',
]

export default function NewComplaintView({ user, onCreated }: { user: any; onCreated?: (id: string) => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([])
  const [damageCategories, setDamageCategories] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])

  const [form, setForm] = useState({
    equipmentTypeId: '',
    assetId: '',
    damageCategoryId: '',
    description: '',
    priority: 'Sederhana',
    location: '',
    attachmentUrl: '',
    aiSuggestedCategory: '',
    aiSuggestedPriority: '',
    aiSolution: '',
  })

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const [eqRes, dmgRes] = await Promise.all([
        fetch('/api/equipment-types'),
        fetch('/api/damage-categories'),
      ])
      const eqData = await eqRes.json()
      const dmgData = await dmgRes.json()
      setEquipmentTypes(eqData.equipmentTypes || [])
      setDamageCategories(dmgData.damageCategories || [])
    } catch (e) {
      toast.error('Gagal memuatkan data rujukan.')
    }
  }

  // Fetch assets when equipment type changes
  useEffect(() => {
    if (form.equipmentTypeId) {
      fetch(`/api/assets?equipmentTypeId=${form.equipmentTypeId}`)
        .then((r) => r.json())
        .then((d) => setAssets(d.assets || []))
        .catch(() => setAssets([]))
    } else {
      setAssets([])
    }
    setForm((f) => ({ ...f, assetId: '' }))
  }, [form.equipmentTypeId])

  // AI auto-classify
  const runAIClassify = async () => {
    if (form.description.length < 10) {
      toast.warning('Sila taip penerangan sekurang-kurangnya 10 aksara.')
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: form.description }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.aiSuggestedCategory) {
          const matchedCat = damageCategories.find((c) => c.name === data.aiSuggestedCategory)
          if (matchedCat) {
            setForm((f) => ({
              ...f,
              damageCategoryId: matchedCat.id,
              aiSuggestedCategory: data.aiSuggestedCategory,
              aiSuggestedPriority: data.aiSuggestedPriority,
              priority: data.aiSuggestedPriority || f.priority,
              aiSolution: data.aiSolution || '',
            }))
            toast.success('AI mencadangkan klasifikasi. Sila semak dan sahkan.')
          } else {
            setForm((f) => ({ ...f, aiSuggestedCategory: data.aiSuggestedCategory, aiSolution: data.aiSolution || '' }))
            toast.info('AI mencadangkan: ' + data.aiSuggestedCategory)
          }
        }
        if (data.aiSolution) {
          setForm((f) => ({ ...f, aiSolution: data.aiSolution }))
        }
      } else {
        toast.error(data.error || 'AI tidak tersedia sebentar.')
      }
    } catch (e) {
      toast.error('Ralat AI. Cuba lagi.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.equipmentTypeId || !form.damageCategoryId || !form.description || !form.location) {
      toast.error('Sila lengkapkan semua medan wajib.')
      return
    }
    if (form.description.length < 10) {
      toast.error('Penerangan kerosakan mesti sekurang-kurangnya 10 aksara.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Galamenghantar aduan.')
      } else {
        toast.success(`Aduan berjaya dihantar! Tiket: ${data.complaint.ticketNo}`)
        onCreated?.(data.complaint.id)
        // Reset
        setStep(1)
        setForm({
          equipmentTypeId: '', assetId: '', damageCategoryId: '', description: '',
          priority: 'Sederhana', location: '', attachmentUrl: '',
          aiSuggestedCategory: '', aiSuggestedPriority: '', aiSolution: '',
        })
      }
    } catch (e) {
      toast.error('Ralat rangkaian.')
    } finally {
      setLoading(false)
    }
  }

  const selectedEq = equipmentTypes.find((e) => e.id === form.equipmentTypeId)
  const selectedCat = damageCategories.find((c) => c.id === form.damageCategoryId)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          {[
            { n: 1, label: 'Peralatan', icon: Cpu },
            { n: 2, label: 'Kerosakan', icon: AlertCircle },
            { n: 3, label: 'Maklumat', icon: MapPin },
          ].map((s, i, arr) => {
            const Icon = s.icon
            const active = step === s.n
            const done = step > s.n
            return (
              <div key={s.n} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                    done ? 'bg-emerald-400/30 text-emerald-300 border border-emerald-400/50'
                    : active ? 'bg-cyan-400/30 text-cyan-300 border border-cyan-400/50'
                    : 'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs ${active ? 'text-white' : done ? 'text-emerald-300' : 'text-white/40'}`}>{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded ${done ? 'bg-emerald-400/40' : 'bg-white/10'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Equipment */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-1">Pilih Jenis Peralatan</h3>
              <p className="text-white/60 text-sm mb-4">Pilih kategori peralatan ICT yang bermasalah.</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {equipmentTypes.filter((e) => e.isActive).map((eq) => {
                  const Icon = ICON_MAP[eq.icon] || Monitor
                  const selected = form.equipmentTypeId === eq.id
                  return (
                    <button
                      key={eq.id}
                      onClick={() => setForm({ ...form, equipmentTypeId: eq.id })}
                      className={`glass-subtle p-4 hover-glow text-left transition ${selected ? 'ring-2 ring-cyan-400 bg-cyan-400/10' : ''}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-teal-600/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-cyan-300" />
                        </div>
                        <span className="text-cyan-300 font-mono text-xs">{eq.code}</span>
                      </div>
                      <div className="text-white text-sm font-medium">{eq.name}</div>
                      <div className="text-white/50 text-xs mt-1">{eq._count?.assets || 0} aset berdaftar</div>
                    </button>
                  )
                })}
              </div>

              {/* Asset selection (optional) */}
              {form.equipmentTypeId && assets.length > 0 && (
                <div className="mt-6">
                  <label className="text-white text-sm font-medium mb-2 block">Pilih Aset (pilihan)</label>
                  <select
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    value={form.assetId}
                    onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  >
                    <option value="" style={{ background: '#15375f' }}>— Tidak pasti / Tiada dalam senarai —</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id} style={{ background: '#15375f' }}>
                        {a.assetTag} · {a.brandModel} · {a.location}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!form.equipmentTypeId}
                  className="btn-primary-glass px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  Seterusnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Damage */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-1">Penerangan Kerosakan</h3>
              <p className="text-white/60 text-sm mb-4">Terangkan masalah secara terperinci. AI akan mencadangkan kategori.</p>

              {/* AI feature highlight */}
              <div className="glass-subtle p-3 mb-4 flex items-start gap-3 border border-cyan-400/30">
                <Sparkles className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="text-white font-medium">Ciri AI (GLM 5.2)</div>
                  <div className="text-white/60 text-xs">Taip penerangan, kemudian klik butang AI untuk cadangan klasifikasi automatik.</div>
                </div>
              </div>

              <label className="text-white text-sm font-medium mb-2 block">Penerangan Kerosakan *</label>
              <textarea
                className="glass-input w-full px-3 py-2.5 text-sm min-h-[120px] resize-y"
                placeholder="Contoh: Komputer di makmal 2 tidak dapat dihidupkan. Lampu indicator CPU tidak menyala. Sudah cuba tukar kabel power tapi sama juga."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={5000}
              />
              <div className="text-right text-xs text-white/40 mt-1">{form.description.length}/5000</div>

              <button
                onClick={runAIClassify}
                disabled={aiLoading || form.description.length < 10}
                className="mt-2 btn-glass px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
                Cadang Klasifikasi dengan AI
              </button>

              {/* AI Solution display */}
              {form.aiSolution && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 glass-subtle p-3 border border-cyan-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span className="text-cyan-300 text-sm font-semibold">Cadangan Penyelesaian AI</span>
                  </div>
                  <p className="text-white/80 text-sm">{form.aiSolution}</p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Kategori Kerosakan *</label>
                  <select
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    value={form.damageCategoryId}
                    onChange={(e) => {
                      const cat = damageCategories.find((c) => c.id === e.target.value)
                      setForm({ ...form, damageCategoryId: e.target.value, priority: cat?.defaultPriority || form.priority })
                    }}
                  >
                    <option value="" style={{ background: '#15375f' }}>— Pilih Kategori —</option>
                    {damageCategories.filter((c) => c.isActive).map((c) => (
                      <option key={c.id} value={c.id} style={{ background: '#15375f' }}>
                        {c.name} (Keutamaan: {c.defaultPriority})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Tahap Keutamaan *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Rendah', 'Sederhana', 'Tinggi', 'Kritikal'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm({ ...form, priority: p })}
                        className={`text-xs py-2 rounded-lg border transition ${form.priority === p ? 'ring-2 ring-cyan-400' : ''}`}
                        style={{
                          background: p === form.priority ? 'rgba(0, 194, 168, 0.2)' : 'rgba(255,255,255,0.05)',
                          borderColor: p === form.priority ? 'rgba(0, 194, 168, 0.5)' : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="btn-glass px-5 py-2 text-sm flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.damageCategoryId || !form.description}
                  className="btn-primary-glass px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  Seterusnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Reporter info & submit */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="glass-card p-6">
              <h3 className="text-white font-bold text-lg mb-1">Maklumat Pelapor & Lokasi</h3>
              <p className="text-white/60 text-sm mb-4">Sahkan maklumat dan pilih lokasi peralatan.</p>

              {/* Auto-filled reporter info */}
              <div className="glass-subtle p-3 mb-4">
                <div className="text-xs text-white/60 mb-2">Maklumat Pelapor (auto-isi dari akaun)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-white/50">Nama:</span> <span className="text-white">{user.fullName}</span></div>
                  <div><span className="text-white/50">No. Pekerja:</span> <span className="text-white">{user.staffId}</span></div>
                  <div><span className="text-white/50">Jabatan:</span> <span className="text-white">{user.department}</span></div>
                  <div><span className="text-white/50">E-mel:</span> <span className="text-white">{user.email}</span></div>
                </div>
              </div>

              <label className="text-white text-sm font-medium mb-2 block">Lokasi Peralatan *</label>
              <select
                className="glass-input w-full px-3 py-2.5 text-sm"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="" style={{ background: '#15375f' }}>— Pilih Lokasi —</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l} style={{ background: '#15375f' }}>{l}</option>
                ))}
              </select>

              <label className="text-white text-sm font-medium mb-2 block mt-4">Lampiran Gambar (pilihan)</label>
              <div className="glass-subtle p-4 border-dashed border-2 border-white/15 text-center">
                <Upload className="w-6 h-6 text-white/40 mx-auto mb-2" />
                <p className="text-white/60 text-sm">Muat naik gambar bukti kerosakan (Coming soon)</p>
                <p className="text-white/40 text-xs">PNG/JPG sehingga 5MB</p>
              </div>

              {/* Summary */}
              <div className="glass-subtle p-4 mt-4">
                <div className="text-xs text-white/60 mb-2">Ringkasan Aduan</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Peralatan:</span><span className="text-white">{selectedEq?.name || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Kategori:</span><span className="text-white">{selectedCat?.name || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Keutamaan:</span><PriorityBadge priority={form.priority} /></div>
                  <div className="flex justify-between"><span className="text-white/50">Lokasi:</span><span className="text-white">{form.location || '-'}</span></div>
                  {form.aiSuggestedCategory && (
                    <div className="flex justify-between"><span className="text-white/50">AI Cadangan:</span><span className="text-cyan-300 text-xs">{form.aiSuggestedCategory}</span></div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(2)} className="btn-glass px-5 py-2 text-sm flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.location}
                  className="btn-primary-glass px-5 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Hantar Aduan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
