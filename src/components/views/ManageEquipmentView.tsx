'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Laptop, Printer, Projector, Network, Router, Wifi,
  Plus, Edit, X, Loader2, Power, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle, EmptyState, LoadingSpinner } from '@/components/shared/Glass'

const ICON_MAP: Record<string, any> = { Monitor, Laptop, Printer, Projector, Network, Router, Wifi }
const ICON_OPTIONS = ['Monitor', 'Laptop', 'Printer', 'Projector', 'Network', 'Router', 'Wifi']

export default function ManageEquipmentView() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ code: '', name: '', icon: 'Monitor' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchEquipment() }, [])

  const fetchEquipment = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/equipment-types')
      if (res.ok) {
        const data = await res.json()
        setItems(data.equipmentTypes || [])
      }
    } finally { setLoading(false) }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ code: '', name: '', icon: 'Monitor' })
    setShowForm(true)
  }

  const openEdit = (item: any) => {
    setEditing(item)
    setForm({ code: item.code, name: item.name, icon: item.icon })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.code || !form.name) {
      toast.error('Kod dan nama diperlukan.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch('/api/equipment-types', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, name: form.name, icon: form.icon }),
        })
        const data = await res.json()
        if (res.ok) toast.success('Kemas kini berjaya!')
        else toast.error(data.error)
      } else {
        const res = await fetch('/api/equipment-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (res.ok) toast.success('Jenis peralatan ditambah!')
        else toast.error(data.error)
      }
      setShowForm(false)
      fetchEquipment()
    } finally { setSaving(false) }
  }

  const toggleActive = async (item: any) => {
    await fetch('/api/equipment-types', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    })
    fetchEquipment()
  }

  return (
    <GlassCard>
      <SectionTitle
        title="Jenis Peralatan ICT"
        subtitle="Urus kategori peralatan ICT (EQ-01 hingga EQ-07)"
        icon={Monitor}
        action={
          <button onClick={openNew} className="btn-primary-glass px-4 py-1.5 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        }
      />
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon={Monitor} title="Tiada rekod" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => {
            const Icon = ICON_MAP[it.icon] || Monitor
            return (
              <motion.div key={it.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-subtle p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-teal-600/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(it)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleActive(it)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${it.isActive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-cyan-300 font-mono text-xs">{it.code}</div>
                <div className="text-white font-semibold text-sm">{it.name}</div>
                <div className="text-white/50 text-xs mt-1">{it._count?.assets || 0} aset · {it._count?.complaints || 0} aduan</div>
                {!it.isActive && <div className="mt-2 text-rose-300 text-xs">Tidak Aktif</div>}
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="glass-strong p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{editing ? 'Edit' : 'Tambah'} Jenis Peralatan</h3>
                <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-white text-sm mb-1 block">Kod *</label>
                  <input className="glass-input w-full px-3 py-2 text-sm" placeholder="EQ-08" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} disabled={!!editing} />
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Nama *</label>
                  <input className="glass-input w-full px-3 py-2 text-sm" placeholder="Nama peralatan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Ikon</label>
                  <div className="grid grid-cols-7 gap-2">
                    {ICON_OPTIONS.map((ic) => {
                      const Icon = ICON_MAP[ic]
                      return (
                        <button key={ic} onClick={() => setForm({ ...form, icon: ic })} className={`aspect-square rounded-lg flex items-center justify-center border ${form.icon === ic ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-300' : 'bg-white/5 border-white/10 text-white/60'}`}>
                          <Icon className="w-5 h-5" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <button onClick={save} disabled={saving} className="btn-primary-glass w-full py-2 text-sm flex items-center justify-center gap-2 mt-4">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Simpan' : 'Tambah'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
