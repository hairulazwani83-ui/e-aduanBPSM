'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, Search, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'
import { GlassCard, SectionTitle, EmptyState, LoadingSpinner } from '@/components/shared/Glass'
import { formatDateTime } from '@/lib/ui-utils'

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Log Masuk',
  LOGIN_FAILED: 'Log Masuk Gagal',
  LOGIN_LOCKED: 'Akaun Dikunci',
  LOGIN_DISABLED: 'Akaun Dinyahaktif',
  LOGOUT: 'Log Keluar',
  REGISTER: 'Pendaftaran',
  CREATE_COMPLAINT: 'Cipta Aduan',
  UPDATE_COMPLAINT_STATUS: 'Kemas Kini Status',
  CREATE_WORKLOG: 'Log Kerja',
  RATE_COMPLAINT: 'Rating',
  CREATE_ASSET: 'Tambah Aset',
  UPDATE_USER: 'Kemas Kini Pengguna',
  RESPOND_SUGGESTION: 'Respons Cadangan',
}

export default function AuditLogView() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')

  useEffect(() => { fetchLogs() }, [search, filterAction, filterSeverity])

  const fetchLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('action', search)
    if (filterSeverity) params.set('severity', filterSeverity)
    params.set('limit', '200')
    try {
      const res = await fetch(`/api/audit-log?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      }
    } finally { setLoading(false) }
  }

  return (
    <GlassCard>
      <SectionTitle title="Log Audit Sistem" subtitle={`${total} rekod aktiviti pengguna & keselamatan`} icon={ScrollText} />

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input className="glass-input w-full pl-10 pr-3 py-2 text-sm" placeholder="Cari tindakan (cth: LOGIN, CREATE_COMPLAINT)..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="glass-input px-3 py-2 text-sm" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="" style={{ background: '#15375f' }}>Semua Tahap</option>
          <option value="info" style={{ background: '#15375f' }}>Info</option>
          <option value="warning" style={{ background: '#15375f' }}>Amaran</option>
          <option value="critical" style={{ background: '#15375f' }}>Kritikal</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : logs.length === 0 ? <EmptyState icon={ScrollText} title="Tiada log" /> : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scroll pr-1">
          {logs.map((log) => {
            const isCritical = log.severity === 'critical'
            const isWarning = log.severity === 'warning'
            return (
              <motion.div key={log.id} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} className={`glass-subtle p-3 flex items-start gap-3 ${isCritical ? 'border-l-2 border-rose-500' : isWarning ? 'border-l-2 border-amber-500' : ''}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isCritical ? 'bg-rose-400/15 text-rose-300' : isWarning ? 'bg-amber-400/15 text-amber-300' : 'bg-cyan-400/15 text-cyan-300'
                }`}>
                  {isCritical ? <ShieldAlert className="w-4 h-4" /> : isWarning ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-semibold text-sm">{ACTION_LABELS[log.action] || log.action}</span>
                    <span className={`status-badge ${
                      isCritical ? 'priority-kritikal' : isWarning ? 'priority-tinggi' : 'status-baru'
                    }`}>{log.severity}</span>
                    {log.user && <span className="text-white/60 text-xs">oleh {log.user.fullName}</span>}
                  </div>
                  {log.details && <p className="text-white/80 text-xs mb-1">{log.details}</p>}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-white/40">
                    <span>{formatDateTime(log.createdAt)}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    {log.entity && <span>Entiti: {log.entity}</span>}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
