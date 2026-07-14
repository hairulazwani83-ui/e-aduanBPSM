'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User as UserIcon, Mail, BadgeCheck, Building2, Phone, Shield,
  Calendar, LogOut, ShieldCheck, Lock, KeyRound,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle } from '@/components/shared/Glass'
import { formatDateTime } from '@/lib/ui-utils'

export default function ProfileView({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast.success('Log keluar berjaya.')
    setTimeout(() => window.location.reload(), 500)
  }

  const roleLabels: Record<string, string> = {
    reporter: 'Pelapor (Staf/Pensyarah)',
    technician: 'Juruteknik ICT',
    admin: 'Admin ICT',
    management: 'Pengurusan',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{user.fullName}</h2>
              <p className="text-white/60 text-sm">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="status-badge status-baru">{roleLabels[user.role]}</span>
                <span className="status-badge priority-sederhana">{user.department}</span>
                {user.isActive ? (
                  <span className="status-badge status-selesai">Aktif</span>
                ) : (
                  <span className="status-badge status-hold">Tidak Aktif</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={BadgeCheck} label="No. Pekerja" value={user.staffId} />
            <InfoRow icon={Mail} label="E-mel" value={user.email} />
            <InfoRow icon={Building2} label="Jabatan/Unit" value={user.department} />
            <InfoRow icon={Phone} label="No. Telefon" value={user.phone || '-'} />
            <InfoRow icon={Calendar} label="Akaun Dicipta" value={formatDateTime(user.createdAt)} />
            <InfoRow icon={Calendar} label="Log Masuk Terakhir" value={formatDateTime(user.lastLoginAt)} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Security info */}
      <GlassCard>
        <SectionTitle title="Keselamatan Akaun" subtitle="Maklumat keselamatan & privasi" icon={ShieldCheck} />
        <div className="space-y-3">
          <SecurityItem
            icon={Lock}
            title="Kata Laluan Disulitkan"
            description="Kata laluan anda disulitkan menggunakan bcrypt (10 rounds) dan tidak boleh dibaca sesiapa."
            status="Aktif"
          />
          <SecurityItem
            icon={KeyRound}
            title="Pengesahan Dua Faktor"
            description="Pengesahan berasaskan sesi JWT dengan tempoh tamat 8 jam. Log masuk gagal akan mengunci akaun selepas 5 percubaan."
            status="Aktif"
          />
          <SecurityItem
            icon={Shield}
            title="Kawalan Akses Berperanan (RBAC)"
            description={`Akses anda: ${roleLabels[user.role]}. Setiap permintaan API disahkan mengikut peranan.`}
            status="Aktif"
          />
          <SecurityItem
            icon={ShieldCheck}
            title="Audit Logging"
            description="Semua tindakan sensitif direkod dalam log audit untuk tujuan integriti data."
            status="Aktif"
          />
        </div>
      </GlassCard>

      {/* Actions */}
      <GlassCard>
        <SectionTitle title="Tindakan Akaun" icon={UserIcon} />
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-sm font-medium flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          Log Keluar
        </button>
      </GlassCard>

      <div className="text-center text-xs text-white/40 py-2">
        <p>Untuk menukar kata laluan atau maklumat akaun, sila hubungi Admin ICT.</p>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass-subtle p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
        <Icon className="w-4 h-4 text-cyan-300" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/50">{label}</div>
        <div className="text-white text-sm truncate">{value}</div>
      </div>
    </div>
  )
}

function SecurityItem({ icon: Icon, title, description, status }: { icon: any; title: string; description: string; status: string }) {
  return (
    <div className="glass-subtle p-3 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-emerald-400/15 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-emerald-300" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-white text-sm font-medium">{title}</h4>
          <span className="status-badge status-selesai text-[10px]">{status}</span>
        </div>
        <p className="text-white/60 text-xs mt-1">{description}</p>
      </div>
    </div>
  )
}
