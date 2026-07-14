'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Plus, Edit, X, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle, EmptyState, LoadingSpinner } from '@/components/shared/Glass'
import { formatDate } from '@/lib/ui-utils'

const LOCATIONS = [
  'Blok A - Bilik Kuliah 1', 'Blok A - Bilik Kuliah 2', 'Blok A - Makmal Komputer 1', 'Blok A - Makmal Komputer 2',
  'Blok B - Bengkel Elektrik', 'Blok B - Bengkel Elektronik', 'Blok B - Bengkel Mekanikal',
  'Blok C - Pejabat Pentadbiran', 'Blok C - Bilik Staf',
  'Blok D - Perpustakaan', 'Blok D - Bilik Pensyarah',
  'Blok E - Makmal Rangkaian', 'Blok E - Pusat Komputer',
  'Auditorium', 'Surau', 'Kafeteria',
]

export default function ManageAssetsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterEq, setFilterEq] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ assetTag: '', equipmentTypeId: '', brandModel: '', location: '', purchaseDate: '', status: 'Aktif', notes: '' })
  const [saving, setSaving] = useState(false)
  const isAdmin = user.role === 'admin'

  useEffect(() => {
    fetchEquipment()
    fetchItems()
  }, [search, filterEq, filterStatus])

  const fetchEquipment = async () => {
    const res = await fetch('/api/equipment-types')
    if (res.ok) {
      const data = await res.json()
      setEquipmentTypes(data.equipmentTypes || [])
    }
  }

  const fetchItems = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterEq) params.set('equipmentTypeId', filterEq)
    if (filterStatus) params.set('status', filterStatus)
    try {
      const res = await fetch(`/api/assets?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.assets || [])
      }
    } finally { setLoading(false) }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ assetTag: '', equipmentTypeId: '', brandModel: '', location: '', purchaseDate: '', status: 'Aktif', notes: '' })
    setShowForm(true)
  }

  const openEdit = (it: any) => {
    setEditing(it)
    setForm({
      assetTag: it.assetTag, equipmentTypeId: it.equipmentTypeId, brandModel: it.brandModel,
      location: it.location, purchaseDate: it.purchaseDate ? it.purchaseDate.split('T')[0] : '',
      status: it.status, notes: it.notes || '',
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.assetTag || !form.equipmentTypeId || !form.brandModel || !form.location) {
      toast.error('Semua medan wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing.id, ...form } : form
      const res = await fetch('/api/assets', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        toast.success(editing ? 'Kemas kini berjaya!' : 'Aset ditambah!')
        setShowForm(false)
        fetchItems()
      } else toast.error(data.error)
    } finally { setSaving(false) }
  }

  return (
    <GlassCard>
      <SectionTitle title="Aset ICT" subtitle="Rekod aset peralatan ICT berdaftar" icon={Cpu}
        action={isAdmin && <button onClick={openNew} className="btn-primary-glass px-4 py-1.5 text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Aset</button>}
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input className="glass-input w-full pl-10 pr-3 py-2 text-sm" placeholder="Cari tag aset, jenama, lokasi..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="glass-input px-3 py-2 text-sm" value={filterEq} onChange={(e) => setFilterEq(e.target.value)}>
          <option value="" style={{ background: '#15375f' }}>Semua Peralatan</option>
          {equipmentTypes.map((e) => <option key={e.id} value={e.id} style={{ background: '#15375f' }}>{e.code} - {e.name}</option>)}
        </select>
        <select className="glass-input px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="" style={{ background: '#15375f' }}>Semua Status</option>
          <option value="Aktif" style={{ background: '#15375f' }}>Aktif</option>
          <option value="Rosak" style={{ background: '#15375f' }}>Rosak</option>
          <option value="Dilupus" style={{ background: '#15375f' }}>Dilupus</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : items.length === 0 ? <EmptyState icon={Cpu} title="Tiada aset dijumpai" /> : (
        <div className="overflow-x-auto custom-scroll max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="text-left text-white/60 text-xs bg-[#15375f]/80 backdrop-blur-md">
                <th className="py-2 px-3">Tag Aset</th>
                <th className="py-2 px-3">Jenama/Model</th>
                <th className="py-2 px-3">Peralatan</th>
                <th className="py-2 px-3">Lokasi</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Dibeli</th>
                {isAdmin && <th className="py-2 px-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="py-2 px-3 text-cyan-300 font-mono text-xs">{a.assetTag}</td>
                  <td className="py-2 px-3 text-white/90">{a.brandModel}</td>
                  <td className="py-2 px-3 text-white/70 text-xs">{a.equipmentType?.code}</td>
                  <td className="py-2 px-3 text-white/70 text-xs">{a.location}</td>
                  <td className="py-2 px-3">
                    <span className={`status-badge ${a.status === 'Aktif' ? 'status-selesai' : a.status === 'Rosak' ? 'status-hold' : 'status-ditutup'}`}>{a.status}</span>
                  </td>
                  <td className="py-2 px-3 text-white/60 text-xs">{a.purchaseDate ? formatDate(a.purchaseDate) : '-'}</td>
                  {isAdmin && (
                    <td className="py-2 px-3 text-right">
                      <button onClick={() => openEdit(a)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 inline-flex items-center justify-center text-white/70"><Edit className="w-3.5 h-3.5" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="glass-strong p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scroll">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">{editing ? 'Edit' : 'Tambah'} Aset</h3>
                <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white text-sm mb-1 block">Tag Aset *</label>
                  <input className="glass-input w-full px-3 py-2 text-sm" placeholder="AST-0001" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} />
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Jenis Peralatan *</label>
                  <select className="glass-input w-full px-3 py-2 text-sm" value={form.equipmentTypeId} onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}>
                    <option value="" style={{ background: '#15375f' }}>— Pilih —</option>
                    {equipmentTypes.map((e) => <option key={e.id} value={e.id} style={{ background: '#15375f' }}>{e.code} - {e.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-white text-sm mb-1 block">Jenama/Model *</label>
                  <input className="glass-input w-full px-3 py-2 text-sm" placeholder="Dell OptiPlex 7090" value={form.brandModel} onChange={(e) => setForm({ ...form, brandModel: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-white text-sm mb-1 block">Lokasi *</label>
                  <select className="glass-input w-full px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                    <option value="" style={{ background: '#15375f' }}>— Pilih —</option>
                    {LOCATIONS.map((l) => <option key={l} value={l} style={{ background: '#15375f' }}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Tarikh Pembelian</label>
                  <input type="date" className="glass-input w-full px-3 py-2 text-sm" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-white text-sm mb-1 block">Status</label>
                  <select className="glass-input w-full px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="Aktif" style={{ background: '#15375f' }}>Aktif</option>
                    <option value="Rosak" style={{ background: '#15375f' }}>Rosak</option>
                    <option value="Dilupus" style={{ background: '#15375f' }}>Dilupus</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-white text-sm mb-1 block">Nota</label>
                  <textarea className="glass-input w-full px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
