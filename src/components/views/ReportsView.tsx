'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, Loader2, Calendar, DollarSign, AlertCircle,
  Sparkles, BarChart3, Printer,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { GlassCard, SectionTitle, LoadingSpinner } from '@/components/shared/Glass'
import { formatRM, formatDate } from '@/lib/ui-utils'

const PIE_COLORS = ['#00C2A8', '#17A2B8', '#5BC0DE', '#FFB347', '#FF6B6B', '#4ECDC4']

export default function ReportsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<any>(null)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => { fetchReport() }, [month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setReport(data)
      }
    } catch (e) {
      toast.error('Gagal memuatkan laporan.')
    } finally {
      setLoading(false)
    }
  }

  const generateAISummary = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      })
      const data = await res.json()
      if (res.ok) {
        setAiSummary(data.summary)
        toast.success('Ringkasan AI dijana!')
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } catch (e) {
      toast.error('Ralat AI.')
    } finally {
      setAiLoading(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  const downloadCSV = () => {
    if (!report) return
    const rows = [['Ticket No', 'Status', 'Priority', 'Kategori', 'Peralatan', 'Lokasi', 'Pelapor', 'Dicipta', 'Selesai', 'Kos (RM)']]
    report.complaints.forEach((c: any) => {
      rows.push([
        c.ticketNo, c.status, c.priority,
        c.damageCategory?.name || '', c.equipmentType?.name || '',
        c.location, c.reporter?.fullName || '',
        formatDate(c.createdAt), c.resolvedAt ? formatDate(c.resolvedAt) : '-',
        c.workLogs.reduce((s: number, w: any) => s + w.cost, 0).toFixed(2),
      ])
    })
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_eAduan_${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV dimuat turun!')
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <SectionTitle
          title="Laporan Bulanan eAduan ICT"
          subtitle="Jana laporan statistik bulanan untuk pengurusan & audit"
          icon={FileText}
          action={
            <div className="flex items-center gap-2">
              <input
                type="month"
                className="glass-input px-3 py-1.5 text-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <button onClick={printReport} className="btn-glass px-3 py-1.5 text-sm flex items-center gap-1">
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button onClick={downloadCSV} className="btn-glass px-3 py-1.5 text-sm flex items-center gap-1">
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>
          }
        />

        {loading ? (
          <LoadingSpinner text="Memuatkan laporan..." />
        ) : !report ? (
          <p className="text-white/60 text-center py-8">Tiada data.</p>
        ) : (
          <div className="space-y-4">
            {/* Report header */}
            <div className="glass-subtle p-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="brand-logo">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-lg">JABATAN TENAGA MANUSIA (JTM)</div>
                  <div className="text-white/70 text-sm">ADTEC JTM Kampus Pasir Gudang · Unit ICT</div>
                </div>
              </div>
              <h2 className="text-white text-xl font-bold mt-3">LAPORAN BULANAN ADUAN KEROSAKAN ICT</h2>
              <p className="text-white/60 text-sm">Tempoh: {report.period.label}</p>
              <p className="text-white/40 text-xs mt-1">Dijana pada: {formatDate(new Date(), { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Jumlah Aduan" value={report.summary.totalComplaints} color="cyan" />
              <StatBox label="Selesai" value={report.summary.resolvedCount} color="teal" />
              <StatBox label="Ditutup" value={report.summary.closedCount} color="teal" />
              <StatBox label="Belum Selesai" value={report.summary.newCount + report.summary.inProgressCount + report.summary.onHoldCount} color="amber" />
              <StatBox label="Kos Penyelenggaraan" value={formatRM(report.summary.totalCost)} color="teal" />
              <StatBox label="Purata Resolusi" value={`${report.summary.avgResolutionHours}j`} color="cyan" />
              <StatBox label="On Hold" value={report.summary.onHoldCount} color="rose" />
              <StatBox label="Dalam Tindakan" value={report.summary.inProgressCount} color="amber" />
            </div>

            {/* AI Summary */}
            <div className="glass-subtle p-4 border border-cyan-400/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                  <h3 className="text-cyan-300 font-semibold text-sm">Ringkasan AI (GLM 5.2)</h3>
                </div>
                <button onClick={generateAISummary} disabled={aiLoading} className="btn-glass px-3 py-1 text-xs flex items-center gap-1">
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {aiSummary ? 'Jana Semula' : 'Jana Ringkasan'}
                </button>
              </div>
              {aiSummary ? (
                <p className="text-white/90 text-sm leading-relaxed">{aiSummary}</p>
              ) : (
                <p className="text-white/50 text-sm">Klik butang untuk menjana ringkasan naratif automatik menggunakan AI.</p>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-subtle p-4">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-300" /> Aduan mengikut Peralatan
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.byEquipment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={10} angle={-15} textAnchor="end" height={50} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'rgba(15,35,64,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }} />
                    <Bar dataKey="count" fill="#17A2B8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-subtle p-4">
                <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-cyan-300" /> Aduan mengikut Kategori
                </h4>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={report.byDamage} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                      {report.byDamage.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15,35,64,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#fff', fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By location */}
            <div className="glass-subtle p-4">
              <h4 className="text-white font-semibold text-sm mb-3">Top Lokasi Bermasalah</h4>
              <div className="space-y-2">
                {report.byLocation.slice(0, 8).map((l: any, i: number) => {
                  const max = report.byLocation[0]?.count || 1
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-white/80">{l.name}</span>
                        <span className="text-cyan-300 font-semibold">{l.count}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-500" style={{ width: `${(l.count / max) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Complaints table */}
            <div className="glass-subtle p-4">
              <h4 className="text-white font-semibold text-sm mb-3">Senarai Aduan ({report.complaints.length})</h4>
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-white/50 text-xs border-b border-white/10">
                      <th className="py-2 pr-3">Tiket</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Prioriti</th>
                      <th className="py-2 pr-3">Kategori</th>
                      <th className="py-2 pr-3">Lokasi</th>
                      <th className="py-2 pr-3">Dicipta</th>
                      <th className="py-2 pr-3 text-right">Kos (RM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.complaints.slice(0, 50).map((c: any) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/3">
                        <td className="py-2 pr-3 text-cyan-300 font-mono text-xs">{c.ticketNo}</td>
                        <td className="py-2 pr-3 text-white/80 text-xs">{c.status}</td>
                        <td className="py-2 pr-3 text-white/80 text-xs">{c.priority}</td>
                        <td className="py-2 pr-3 text-white/80 text-xs">{c.damageCategory?.name}</td>
                        <td className="py-2 pr-3 text-white/60 text-xs">{c.location}</td>
                        <td className="py-2 pr-3 text-white/60 text-xs">{formatDate(c.createdAt)}</td>
                        <td className="py-2 pr-3 text-right text-emerald-300 text-xs">
                          {c.workLogs.reduce((s: number, w: any) => s + w.cost, 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold text-white border-t border-white/10">
                      <td colSpan={6} className="py-2 text-right">Jumlah Kos:</td>
                      <td className="py-2 text-right text-emerald-300">{formatRM(report.summary.totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Signature block */}
            <div className="glass-subtle p-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-white/60 text-xs">Disediakan oleh</div>
                <div className="text-white font-medium mt-8">Pegawai ICT</div>
                <div className="text-white/50 text-xs">Unit ICT, ADTEC JTM</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">Disemak oleh</div>
                <div className="text-white font-medium mt-8">Ketua Unit ICT</div>
                <div className="text-white/50 text-xs">ADTEC JTM Kampus Pasir Gudang</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">Diluluskan oleh</div>
                <div className="text-white font-medium mt-8">Pengarah</div>
                <div className="text-white/50 text-xs">ADTEC JTM Kampus Pasir Gudang</div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: any; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-300 border-cyan-400/30',
    teal: 'text-teal-300 border-teal-400/30',
    amber: 'text-amber-300 border-amber-400/30',
    rose: 'text-rose-300 border-rose-400/30',
  }
  return (
    <div className={`glass-subtle p-3 border ${colorMap[color]}`}>
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorMap[color].split(' ')[0]}`}>{value}</div>
    </div>
  )
}
