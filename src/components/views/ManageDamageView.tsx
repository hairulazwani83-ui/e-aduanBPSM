'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, Edit, X, Loader2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle, EmptyState, LoadingSpinner, PriorityBadge } from '@/components/shared/Glass'

export default function ManageDamageView() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', description: '', defaultPriority: 'Sederhana' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCats() }, [])

  const fetchCats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/damage-categories')
      if (res.ok) {
        const data = await res.json()
        setItems(data.damageCategories || [])
      }
    } finally { setLoading(false) }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', description: '', defaultPriority: 'Sederhana' })
    setShowForm(true)
  }

  const openEdit = (it: any) => {
    setEditing(it)
    setForm({ name: it.name, description: it.description || '', defaultPriority: it.defaultPriority })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.name) { toast.error('Nama diperlukan.'); return }
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch('/api/damage-categories', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? 'Kemas kini berjaya!' : 'Kategori ditambah!')
        setShowForm(false)
        fetchCats()
      } else toast.error(data.error)
    } finally { setSaving(false) }
  }

  const toggleActive = async (it: any) => {
    await fetch('/api/damage-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: it.id, isActive: !it.isActive }),
    })
    fetchCats()
  }

  return (
    <GlassCard>
      <SectionTitle title="Kategori Kerosakan" subtitle="Urus klasifikasi jenis kerosakan" icon={AlertTriangle}
        action={<button onClick={openNew} className="btn-primary-glass px-4 py-1.5 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah</button>}
      />
      {loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState icon={AlertTriangle} title="Tiada rekod" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((it) => (
            <motion.div key={it.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-subtle p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold text-sm">{it.name}</h4>
                    <PriorityBadge priority={it.defaultPriority} />
                  </div>
                  <p className="text-white/60 text-xs">{it.description || 'Tiada penerangan'}</p>
                  <div className="text-white/40 text-xs mt-1">{it._count?.complaints || 0} aduan</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(it)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleActive(it)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${it.isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}><Power className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {!it.isActive && <div className="mt-2 text-rose-300 text-xs">Tidak Aktif</div>}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="glass-strong p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{editing ? 'Edit' : 'Tambah'} Kategori</h3>
                <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-white text-sm mb-1 block">Nama *</label>
                  <input className="glass-input w-full px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Penerangan</label>
                  <textarea className="glass-input w-full px-3 py-2 text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Keutamaan Default</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Rendah', 'Sederhana', 'Tinggi', 'Kritikal'].map((p) => (
                      <button key={p} onClick={() => setForm({ ...form, defaultPriority: p })} className={`text-xs py-2 rounded-lg border ${form.defaultPriority === p ? 'bg-cyan-400/20 border-cyan-400/50 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={save} disabled={saving} className="btn-primary-glass w-full py-2 text-sm flex items-center justify-center gap-2 mt-4">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Simpan' : 'Tambah'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
