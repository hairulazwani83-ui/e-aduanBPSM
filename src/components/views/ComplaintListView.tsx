'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Ticket, Search, Filter, Loader2, Eye, Clock, CheckCircle2, AlertCircle,
  MapPin, Calendar, User as UserIcon, Wrench, Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  GlassCard, SectionTitle, StatusBadge, PriorityBadge, EmptyState, LoadingSpinner,
} from '@/components/shared/Glass'
import { formatDate, formatDateTime, formatRM, timeAgo } from '@/lib/ui-utils'
import ComplaintDetailModal from './ComplaintDetailModal'

interface Props {
  user: any
  scope: 'all' | 'mine' | 'assigned'
}

export default function ComplaintListView({ user, scope }: Props) {
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    status: '', priority: '', search: '', equipmentTypeId: '', damageCategoryId: '',
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([])
  const [damageCategories, setDamageCategories] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/equipment-types').then((r) => r.json()).then((d) => setEquipmentTypes(d.equipmentTypes || []))
    fetch('/api/damage-categories').then((r) => r.json()).then((d) => setDamageCategories(d.damageCategories || []))
  }, [])

  useEffect(() => {
    fetchComplaints()
  }, [filters, scope])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.search) params.set('search', filters.search)
      if (filters.equipmentTypeId) params.set('equipmentTypeId', filters.equipmentTypeId)
      if (filters.damageCategoryId) params.set('damageCategoryId', filters.damageCategoryId)
      if (scope === 'mine') params.set('reporterId', user.id)
      if (scope === 'assigned') params.set('assignedTo', user.id)
      params.set('limit', '100')

      const res = await fetch(`/api/complaints?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setComplaints(data.complaints || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      toast.error('Gagal memuatkan data.')
    } finally {
      setLoading(false)
    }
  }

  const scopeTitle = scope === 'mine' ? 'Tiket Saya' : scope === 'assigned' ? 'Tugasan Saya' : 'Semua Aduan'
  const scopeSubtitle = scope === 'mine'
    ? 'Senarai aduan yang anda hantar'
    : scope === 'assigned'
    ? 'Tiket yang ditugaskan kepada anda untuk pembaikan'
    : 'Senarai semua aduan kerosakan ICT'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="glass-input w-full pl-10 pr-3 py-2 text-sm"
              placeholder="Cari nombor tiket, penerangan, lokasi..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select className="glass-input px-3 py-2 text-sm min-w-[140px]" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="" style={{ background: '#15375f' }}>Semua Status</option>
            {['Baru', 'Ditugaskan', 'Dalam Tindakan', 'On Hold', 'Selesai', 'Ditutup'].map((s) => (
              <option key={s} value={s} style={{ background: '#15375f' }}>{s}</option>
            ))}
          </select>
          <select className="glass-input px-3 py-2 text-sm min-w-[140px]" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="" style={{ background: '#15375f' }}>Semua Keutamaan</option>
            {['Rendah', 'Sederhana', 'Tinggi', 'Kritikal'].map((p) => (
              <option key={p} value={p} style={{ background: '#15375f' }}>{p}</option>
            ))}
          </select>
          {scope === 'all' && (
            <>
              <select className="glass-input px-3 py-2 text-sm min-w-[160px]" value={filters.equipmentTypeId} onChange={(e) => setFilters({ ...filters, equipmentTypeId: e.target.value })}>
                <option value="" style={{ background: '#15375f' }}>Semua Peralatan</option>
                {equipmentTypes.map((e) => (
                  <option key={e.id} value={e.id} style={{ background: '#15375f' }}>{e.code} - {e.name}</option>
                ))}
              </select>
              <select className="glass-input px-3 py-2 text-sm min-w-[160px]" value={filters.damageCategoryId} onChange={(e) => setFilters({ ...filters, damageCategoryId: e.target.value })}>
                <option value="" style={{ background: '#15375f' }}>Semua Kategori</option>
                {damageCategories.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#15375f' }}>{c.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </GlassCard>

      {/* List */}
      <GlassCard>
        <SectionTitle title={scopeTitle} subtitle={`${total} rekod dijumpai · ${scopeSubtitle}`} icon={scope === 'assigned' ? Wrench : Ticket} />
        {loading ? (
          <LoadingSpinner text="Memuatkan aduan..." />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Tiada Aduan Dijumpai"
            subtitle={scope === 'mine' ? 'Anda belum menghantar sebarang aduan.' : scope === 'assigned' ? 'Tiada tiket ditugaskan kepada anda.' : 'Cuba ubah penapis carian.'}
          />
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto custom-scroll pr-1">
            {complaints.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelected(c.id)}
                className="glass-subtle p-3 hover:bg-white/8 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-cyan-300 font-mono text-xs font-semibold">{c.ticketNo}</span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <span className="text-white/40 text-xs flex-shrink-0">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-white/90 text-sm mb-2 line-clamp-2">{c.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(c.createdAt)}</span>
                  <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {c.reporter?.fullName || '-'}</span>
                  {c.technician && <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {c.technician.fullName}</span>}
                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {c.damageCategory?.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Detail Modal */}
      {selected && (
        <ComplaintDetailModal
          complaintId={selected}
          user={user}
          onClose={() => { setSelected(null); fetchComplaints() }}
        />
      )}
    </div>
  )
}
