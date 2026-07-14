'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Ticket, Clock, CheckCircle2, AlertCircle, Wrench,
  DollarSign, Cpu, TrendingUp, Star,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { StatCard, GlassCard, SectionTitle, LoadingSpinner, StatusBadge, PriorityBadge } from '@/components/shared/Glass'
import { formatRM, formatDateTime, timeAgo } from '@/lib/ui-utils'

interface Stats {
  summary: {
    totalComplaints: number
    newComplaints: number
    inProgress: number
    resolved: number
    closed: number
    onHold: number
    totalWorkLogs: number
    totalCost: number
    totalAssets: number
    activeAssets: number
    damagedAssets: number
    totalUsers: number
    totalReporters: number
    totalTechnicians: number
    avgResolutionHours: number
    avgRating: number
    slaCompliance: number
  }
  recentComplaints: any[]
  monthlyChart: { month: string; label: string; baru: number; selesai: number }[]
  costByMonth: { month: string; label: string; total: number }[]
  byEquipment: { name: string; code: string; count: number }[]
  byDamage: { name: string; count: number }[]
  topDamages: { name: string; count: number }[]
  byLocation: { name: string; count: number }[]
  priorityBreakdown: { name: string; count: number }[]
}

const PIE_COLORS = ['#00C2A8', '#17A2B8', '#5BC0DE', '#FFB347', '#FF6B6B', '#4ECDC4']

export default function DashboardView({ user }: { user: any }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats?months=6')
      if (res.ok) setStats(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner text="Memuatkan data papan pemuka..." />
  if (!stats) return <div className="text-white/60 text-center py-8">Ralat memuatkan data.</div>

  const isAdmin = user.role === 'admin'
  const isManagement = user.role === 'management'
  const isTech = user.role === 'technician'

  return (
    <div className="space-y-4">
      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">Selamat Datang, {user.fullName.split(' ')[0]}!</h2>
          <p className="text-white/60 text-sm mt-1">
            {isAdmin && 'Anda log masuk sebagai Admin ICT. Akses penuh kepada semua modul sistem.'}
            {isManagement && 'Anda log masuk sebagai Pengurusan. Paparan papan pemuka & laporan sahaja.'}
            {isTech && 'Anda log masuk sebagai Juruteknik ICT. Urus tiket yang ditugaskan kepada anda.'}
            {user.role === 'reporter' && 'Anda log masuk sebagai Pelapor. Hantar dan jejak aduan kerosakan ICT.'}
          </p>
        </div>
        <div className="glass-subtle px-4 py-2 text-center">
          <div className="text-xs text-white/60">Log masuk terakhir</div>
          <div className="text-white text-sm font-medium">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}</div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Jumlah Aduan" value={stats.summary.totalComplaints} icon={Ticket} color="cyan" />
        <StatCard label="Aduan Baru" value={stats.summary.newComplaints} icon={AlertCircle} color="amber" />
        <StatCard label="Dalam Tindakan" value={stats.summary.inProgress} icon={Clock} color="violet" />
        <StatCard label="Selesai / Ditutup" value={stats.summary.resolved + stats.summary.closed} icon={CheckCircle2} color="teal" />
        {isAdmin && <StatCard label="Kos Penyelenggaraan" value={formatRM(stats.summary.totalCost)} icon={DollarSign} color="teal" />}
        {isAdmin && <StatCard label="Aset Aktif" value={stats.summary.activeAssets} icon={Cpu} color="cyan" subtitle={`${stats.summary.damagedAssets} aset rosak`} />}
        {isAdmin && <StatCard label="Pengguna Berdaftar" value={stats.summary.totalUsers} icon={TrendingUp} color="blue" subtitle={`${stats.summary.totalTechnicians} juruteknik`} />}
        <StatCard label="Purata Resolusi" value={`${stats.summary.avgResolutionHours}j`} icon={Clock} color="violet" subtitle="jam setiap tiket" />
        <StatCard label="Purata Rating" value={`${stats.summary.avgRating.toFixed(1)} / 5`} icon={Star} color="amber" />
        {isAdmin && <StatCard label="SLA Tercapai" value={`${stats.summary.slaCompliance}%`} icon={CheckCircle2} color="teal" />}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <SectionTitle title="Trend Aduan Bulanan" subtitle="Aduan diterima vs diselesaikan (6 bulan)" icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,35,64,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#fff', fontSize: 12 }} />
              <Bar dataKey="baru" name="Aduan Baru" fill="#5BC0DE" radius={[6, 6, 0, 0]} />
              <Bar dataKey="selesai" name="Selesai" fill="#4ECDC4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Kos Penyelenggaraan Bulanan" subtitle="Jumlah kos (RM) per bulan" icon={DollarSign} />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.costByMonth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,35,64,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }}
                formatter={(v: any) => formatRM(v)}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Kos (RM)"
                stroke="#00C2A8"
                strokeWidth={3}
                dot={{ fill: '#00C2A8', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard>
          <SectionTitle title="Aduan mengikut Kategori" subtitle="Distribusi jenis kerosakan" icon={AlertCircle} />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.byDamage}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
              >
                {stats.byDamage.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(15,35,64,0.6)" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(15,35,64,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#fff', fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Aduan mengikut Peralatan" subtitle="Jumlah aduan per jenis peralatan ICT" icon={Cpu} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.byEquipment} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.6)" fontSize={11} />
              <YAxis type="category" dataKey="code" stroke="rgba(255,255,255,0.6)" fontSize={11} width={60} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,35,64,0.95)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff' }}
              />
              <Bar dataKey="count" name="Bilangan" fill="#17A2B8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Recent complaints + Top issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="lg:col-span-2">
          <SectionTitle title="Aduan Terkini" subtitle="10 aduan paling baru" icon={Ticket} />
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scroll">
            {stats.recentComplaints.length === 0 ? (
              <p className="text-white/50 text-center py-4">Tiada aduan</p>
            ) : (
              stats.recentComplaints.map((c: any) => (
                <div key={c.id} className="glass-subtle p-3 hover:bg-white/8 transition cursor-pointer" onClick={() => window.location.hash = `#complaint-${c.id}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-300 font-mono text-xs font-semibold">{c.ticketNo}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <span className="text-white/40 text-xs">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-white/80 text-sm truncate">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-white/50 mt-1">
                    <span>📍 {c.location}</span>
                    <span>{c.reporter?.fullName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Top 5 Kerosakan" subtitle="Jenis kerosakan paling kerap" icon={AlertCircle} />
          <div className="space-y-3">
            {stats.topDamages.length === 0 ? (
              <p className="text-white/50 text-center py-4">Tiada data</p>
            ) : (
              stats.topDamages.map((d, i) => {
                const max = stats.topDamages[0]?.count || 1
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 text-sm truncate">{d.name}</span>
                      <span className="text-cyan-300 text-sm font-semibold">{d.count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full"
                        style={{ width: `${(d.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
