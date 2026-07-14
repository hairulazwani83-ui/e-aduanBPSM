'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Ticket as TicketIcon, Loader2, MapPin, User, AlertCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle, StatusBadge, PriorityBadge, EmptyState } from '@/components/shared/Glass'
import { formatDateTime, getStatusColor } from '@/lib/ui-utils'
import { History } from 'lucide-react'

export default function TrackTicketView() {
  const [ticketNo, setTicketNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [complaint, setComplaint] = useState<any>(null)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!ticketNo.trim()) {
      toast.warning('Sila masukkan nombor tiket.')
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/complaints/search?ticketNo=${encodeURIComponent(ticketNo.trim())}`)
      const data = await res.json()
      if (res.ok) {
        setComplaint(data.complaint)
      } else {
        setComplaint(null)
        toast.error(data.error || 'Tiket tidak dijumpai.')
      }
    } catch (e) {
      toast.error('Ralat.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <GlassCard>
        <SectionTitle title="Jejak Status Tiket" subtitle="Masukkan nombor tiket (cth: ADT-PG-202607-0001) untuk semak status" icon={Search} />
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <TicketIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              className="glass-input w-full pl-10 pr-3 py-2.5 text-sm"
              placeholder="ADT-PG-YYYYMM-XXXX"
              value={ticketNo}
              onChange={(e) => setTicketNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <button onClick={search} disabled={loading} className="btn-primary-glass px-5 py-2 text-sm flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Cari
          </button>
        </div>
      </GlassCard>

      {searched && !loading && (
        complaint ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-cyan-300 font-mono font-bold">{complaint.ticketNo}</span>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
              </div>
              <p className="text-white/90 mb-4">{complaint.description}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <InfoRow icon={MapPin} label="Lokasi" value={complaint.location} />
                <InfoRow icon={User} label="Pelapor" value={complaint.reporter?.fullName} />
                <InfoRow icon={AlertCircle} label="Kategori" value={complaint.damageCategory?.name} />
                <InfoRow icon={Clock} label="Dicipta" value={formatDateTime(complaint.createdAt)} />
              </div>

              {/* Timeline */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-cyan-300" />
                  <h3 className="text-white font-semibold text-sm">Sejarah Status</h3>
                </div>
                <div className="space-y-3">
                  {complaint.statusHistory.map((h: any, i: number) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full" style={{ background: getStatusColor(h.newStatus) }} />
                        {i < complaint.statusHistory.length - 1 && <div className="w-0.5 h-6 bg-white/10" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="text-white text-sm font-medium">{h.newStatus}</div>
                        <div className="text-white/50 text-xs">{formatDateTime(h.changedAt)} · oleh {h.changedBy?.fullName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <EmptyState icon={TicketIcon} title="Tiket Tidak Dijumpai" subtitle="Pastikan nombor tiket betul atau hubungi Unit ICT." />
        )
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="glass-subtle p-3">
      <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-white text-sm">{value || '-'}</div>
    </div>
  )
}
