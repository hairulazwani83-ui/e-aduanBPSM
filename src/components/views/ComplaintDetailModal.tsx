'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Clock, MapPin, User as UserIcon, Wrench, AlertCircle, Cpu, Send,
  Star, Loader2, History, DollarSign, FileText, Sparkles, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  StatusBadge, PriorityBadge, LoadingSpinner,
} from '@/components/shared/Glass'
import { formatDateTime, formatRM, getStatusColor } from '@/lib/ui-utils'

interface Props {
  complaintId: string
  user: any
  onClose: () => void
}

export default function ComplaintDetailModal({ complaintId, user, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [complaint, setComplaint] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [workLog, setWorkLog] = useState({ actionTaken: '', cost: 0, spareParts: '' })
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [technicians, setTechnicians] = useState<any[]>([])

  useEffect(() => {
    fetchComplaint()
    if (user.role === 'admin') {
      fetch('/api/users?role=technician').then((r) => r.json()).then((d) => setTechnicians(d.users || []))
    }
  }, [complaintId])

  const fetchComplaint = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}`)
      if (res.ok) {
        const data = await res.json()
        setComplaint(data.complaint)
        setRating(data.complaint.reporterRating || 0)
        setFeedback(data.complaint.reporterFeedback || '')
        setAssignTo(data.complaint.assignedTo || '')
      } else {
        toast.error('Tiket tidak dijumpai.')
        onClose()
      }
    } catch (e) {
      toast.error('Ralat memuatkan tiket.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string, note?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Status dikemas kini: ${status}`)
        fetchComplaint()
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const assignTechnician = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: assignTo || null }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(assignTo ? 'Juruteknik ditugaskan!' : 'Tugasan dibatalkan.')
        fetchComplaint()
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const addWorkLog = async () => {
    if (!workLog.actionTaken || workLog.actionTaken.length < 5) {
      toast.error('Sila terangkan tindakan.')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}/work-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workLog),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Log kerja direkod.')
        setWorkLog({ actionTaken: '', cost: 0, spareParts: '' })
        fetchComplaint()
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const submitRating = async () => {
    if (rating < 1) {
      toast.error('Sila pilih rating.')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch(`/api/complaints/${complaintId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Terima kasih atas maklum balas anda!')
        fetchComplaint()
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const canEditStatus = user.role === 'admin' || (user.role === 'technician' && complaint?.assignedTo === user.id)
  const canRate = user.role === 'reporter' && complaint?.reporterId === user.id && ['Selesai', 'Ditutup'].includes(complaint?.status)
  const canAssign = user.role === 'admin'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong w-full max-w-4xl max-h-[92vh] overflow-y-auto custom-scroll"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 glass-strong px-6 py-4 flex items-center justify-between border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-cyan-300 font-mono text-sm font-bold">{complaint?.ticketNo}</span>
                {complaint && <StatusBadge status={complaint.status} />}
                {complaint && <PriorityBadge priority={complaint.priority} />}
              </div>
              <h2 className="text-white font-bold text-lg line-clamp-1">{complaint?.description.slice(0, 60)}...</h2>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {loading || !complaint ? (
              <LoadingSpinner text="Memuatkan..." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: main info */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Description */}
                  <div className="glass-subtle p-4">
                    <div className="text-xs text-white/60 mb-2">Penerangan Kerosakan</div>
                    <p className="text-white text-sm">{complaint.description}</p>
                  </div>

                  {/* AI suggestion */}
                  {(complaint.aiSuggestedCategory || complaint.aiSolution) && (
                    <div className="glass-subtle p-4 border border-cyan-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-cyan-300" />
                        <span className="text-cyan-300 text-sm font-semibold">Cadangan AI (GLM 5.2)</span>
                      </div>
                      {complaint.aiSuggestedCategory && (
                        <div className="text-white/80 text-sm mb-1">
                          <span className="text-white/50">Kategori dicadang:</span> {complaint.aiSuggestedCategory}
                          {complaint.aiSuggestedPriority && <span className="ml-2">· Keutamaan: {complaint.aiSuggestedPriority}</span>}
                        </div>
                      )}
                      {complaint.aiSolution && <p className="text-white/70 text-sm">{complaint.aiSolution}</p>}
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard icon={Cpu} label="Jenis Peralatan" value={`${complaint.equipmentType?.code} - ${complaint.equipmentType?.name}`} />
                    <InfoCard icon={MapPin} label="Lokasi" value={complaint.location} />
                    <InfoCard icon={UserIcon} label="Pelapor" value={`${complaint.reporter?.fullName} (${complaint.reporter?.staffId})`} />
                    <InfoCard icon={AlertCircle} label="Kategori Kerosakan" value={complaint.damageCategory?.name} />
                    <InfoCard icon={Clock} label="Dicipta" value={formatDateTime(complaint.createdAt)} />
                    {complaint.resolvedAt && <InfoCard icon={Clock} label="Diselesaikan" value={formatDateTime(complaint.resolvedAt)} />}
                    {complaint.technician && <InfoCard icon={Wrench} label="Juruteknik" value={complaint.technician.fullName} />}
                    {complaint.asset && <InfoCard icon={Cpu} label="Aset" value={`${complaint.asset.assetTag} · ${complaint.asset.brandModel}`} />}
                  </div>

                  {/* Work logs */}
                  <div className="glass-subtle p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-cyan-300" />
                      <h3 className="text-white font-semibold text-sm">Log Kerja & Kos Penyelenggaraan</h3>
                    </div>
                    {complaint.workLogs.length === 0 ? (
                      <p className="text-white/50 text-sm">Tiada log kerja lagi.</p>
                    ) : (
                      <div className="space-y-2">
                        {complaint.workLogs.map((w: any) => (
                          <div key={w.id} className="glass-subtle p-3">
                            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                              <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {w.technician?.fullName}</span>
                              <span>{formatDateTime(w.loggedAt)}</span>
                            </div>
                            <p className="text-white/90 text-sm">{w.actionTaken}</p>
                            {w.spareParts && <p className="text-white/60 text-xs mt-1">Spare parts: {w.spareParts}</p>}
                            <div className="flex items-center gap-1 text-emerald-300 text-xs mt-1"><DollarSign className="w-3 h-3" /> {formatRM(w.cost)}</div>
                          </div>
                        ))}
                        <div className="text-right text-sm text-emerald-300 font-semibold pt-2 border-t border-white/10">
                          Jumlah Kos: {formatRM(complaint.workLogs.reduce((s: number, w: any) => s + w.cost, 0))}
                        </div>
                      </div>
                    )}

                    {/* Add work log (technician/admin) */}
                    {(user.role === 'technician' && complaint.assignedTo === user.id) || user.role === 'admin' ? (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-sm text-white/70 mb-2 font-medium">Tambah Log Kerja Baharu</div>
                        <textarea
                          className="glass-input w-full px-3 py-2 text-sm mb-2 min-h-[80px]"
                          placeholder="Tindakan yang diambil..."
                          value={workLog.actionTaken}
                          onChange={(e) => setWorkLog({ ...workLog, actionTaken: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="number"
                            className="glass-input px-3 py-2 text-sm"
                            placeholder="Kos (RM)"
                            value={workLog.cost || ''}
                            onChange={(e) => setWorkLog({ ...workLog, cost: parseFloat(e.target.value) || 0 })}
                          />
                          <input
                            className="glass-input px-3 py-2 text-sm"
                            placeholder="Spare parts (pilihan)"
                            value={workLog.spareParts}
                            onChange={(e) => setWorkLog({ ...workLog, spareParts: e.target.value })}
                          />
                        </div>
                        <button
                          onClick={addWorkLog}
                          disabled={actionLoading}
                          className="btn-glass px-4 py-1.5 text-sm flex items-center gap-2"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Rekod Log
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Status history */}
                  <div className="glass-subtle p-4">
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
                            {h.note && <div className="text-white/60 text-xs mt-0.5">{h.note}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="space-y-4">
                  {/* Status update */}
                  {canEditStatus && (
                    <div className="glass-subtle p-4">
                      <h3 className="text-white font-semibold text-sm mb-3">Kemas Kini Status</h3>
                      <div className="space-y-2">
                        {['Baru', 'Ditugaskan', 'Dalam Tindakan', 'On Hold', 'Selesai', 'Ditutup'].map((s) => (
                          <button
                            key={s}
                            onClick={() => updateStatus(s)}
                            disabled={actionLoading || s === complaint.status}
                            className={`w-full px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                              s === complaint.status
                                ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/40'
                                : 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10'
                            }`}
                          >
                            <span>{s}</span>
                            {s === complaint.status && <span className="text-xs">✓ Aktif</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assign technician (admin only) */}
                  {canAssign && (
                    <div className="glass-subtle p-4">
                      <h3 className="text-white font-semibold text-sm mb-3">Tugaskan Juruteknik</h3>
                      <select
                        className="glass-input w-full px-3 py-2 text-sm mb-2"
                        value={assignTo}
                        onChange={(e) => setAssignTo(e.target.value)}
                      >
                        <option value="" style={{ background: '#15375f' }}>— Pilih Juruteknik —</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id} style={{ background: '#15375f' }}>{t.fullName} ({t.department})</option>
                        ))}
                      </select>
                      <button
                        onClick={assignTechnician}
                        disabled={actionLoading}
                        className="btn-primary-glass w-full py-2 text-sm flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                        Tugaskan
                      </button>
                    </div>
                  )}

                  {/* Rating (reporter only) */}
                  {canRate && (
                    <div className="glass-subtle p-4">
                      <h3 className="text-white font-semibold text-sm mb-3">Beri Rating & Maklum Balas</h3>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setRating(s)}
                            className={`transition ${s <= rating ? 'text-amber-400' : 'text-white/30'} hover:text-amber-300`}
                          >
                            <Star className="w-7 h-7 fill-current" />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="glass-input w-full px-3 py-2 text-sm mb-2 min-h-[80px]"
                        placeholder="Maklum balas anda (pilihan)..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                      <button
                        onClick={submitRating}
                        disabled={actionLoading}
                        className="btn-primary-glass w-full py-2 text-sm flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                        Hantar Maklum Balas
                      </button>
                    </div>
                  )}

                  {/* Existing rating display */}
                  {complaint.reporterRating && !canRate && (
                    <div className="glass-subtle p-4">
                      <h3 className="text-white font-semibold text-sm mb-2">Rating dari Pelapor</h3>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s: number) => (
                          <Star key={s} className={`w-5 h-5 ${s <= complaint.reporterRating ? 'text-amber-400 fill-current' : 'text-white/20'}`} />
                        ))}
                      </div>
                      {complaint.reporterFeedback && <p className="text-white/70 text-sm">{complaint.reporterFeedback}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-subtle p-3">
      <div className="flex items-center gap-1.5 text-xs text-white/50 mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-white text-sm">{value || '-'}</div>
    </div>
  )
}
