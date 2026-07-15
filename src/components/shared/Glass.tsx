'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

export function StatCard({
  label, value, icon: Icon, color = 'cyan', subtitle, trend,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'cyan' | 'teal' | 'amber' | 'rose' | 'violet' | 'blue'
  subtitle?: string
  trend?: { value: number; positive?: boolean }
}) {
  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-400/30 to-cyan-600/10 text-cyan-300',
    teal: 'from-teal-400/30 to-teal-600/10 text-teal-300',
    amber: 'from-amber-400/30 to-amber-600/10 text-amber-300',
    rose: 'from-rose-400/30 to-rose-600/10 text-rose-300',
    violet: 'from-violet-400/30 to-violet-600/10 text-violet-300',
    blue: 'from-blue-400/30 to-blue-600/10 text-blue-300',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 hover-glow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`stat-icon bg-gradient-to-br ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${trend.positive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/70">{label}</div>
      {subtitle && <div className="text-xs text-white/50 mt-1">{subtitle}</div>}
    </motion.div>
  )
}

export function GlassCard({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass-card p-5 ${hover ? 'hover-glow' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ title, subtitle, icon: Icon, action }: {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-teal-600/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-cyan-300" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const cls = getStatusClass(status)
  return <span className={`status-badge ${cls}`}>{status}</span>
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'Baru': return 'status-baru'
    case 'Ditugaskan': return 'status-ditugaskan'
    case 'Dalam Tindakan': return 'status-dalam'
    case 'On Hold': return 'status-hold'
    case 'Selesai': return 'status-selesai'
    case 'Ditutup': return 'status-ditutup'
    default: return 'status-baru'
  }
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase()
  let cls = 'priority-sederhana'
  if (p.includes('rendah')) cls = 'priority-rendah'
  else if (p.includes('sederhana')) cls = 'priority-sederhana'
  else if (p.includes('tinggi')) cls = 'priority-tinggi'
  else if (p.includes('kritikal')) cls = 'priority-kritikal'
  return <span className={`status-badge ${cls}`}>{priority}</span>
}

export function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="glass-card p-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
        <Icon className="w-8 h-8 text-white/40" />
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-white/60 mb-4">{subtitle}</p>}
      {action}
    </div>
  )
}

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8 gap-3">
      <div className="w-6 h-6 border-2 border-cyan-300/40 border-t-cyan-300 rounded-full animate-spin" />
      {text && <span className="text-white/70 text-sm">{text}</span>}
    </div>
  )
}
