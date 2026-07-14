'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Power, ShieldAlert, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle, EmptyState, LoadingSpinner } from '@/components/shared/Glass'
import { formatDateTime } from '@/lib/ui-utils'

const ROLE_LABEL: Record<string, string> = {
  reporter: 'Pelapor',
  technician: 'Juruteknik',
  admin: 'Admin',
  management: 'Pengurusan',
}

export default function ManageUsersView() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  useEffect(() => { fetchUsers() }, [search, filterRole])

  const fetchUsers = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterRole) params.set('role', filterRole)
    try {
      const res = await fetch(`/api/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } finally { setLoading(false) }
  }

  const updateRole = async (userId: string, role: string) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, role }),
    })
    if (res.ok) {
      toast.success('Peranan dikemas kini.')
      fetchUsers()
    } else {
      const data = await res.json()
      toast.error(data.error)
    }
  }

  const toggleActive = async (u: any) => {
    const res = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, isActive: !u.isActive }),
    })
    if (res.ok) {
      toast.success(u.isActive ? 'Akaun dinyahaktif.' : 'Akaun diaktifkan.')
      fetchUsers()
    } else {
      const data = await res.json()
      toast.error(data.error)
    }
  }

  return (
    <GlassCard>
      <SectionTitle title="Pengurusan Pengguna" subtitle="Urus akaun pengguna & peranan RBAC" icon={Users} />

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input className="glass-input w-full pl-10 pr-3 py-2 text-sm" placeholder="Cari nama, e-mel, no. pekerja..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="glass-input px-3 py-2 text-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="" style={{ background: '#15375f' }}>Semua Peranan</option>
          <option value="reporter" style={{ background: '#15375f' }}>Pelapor</option>
          <option value="technician" style={{ background: '#15375f' }}>Juruteknik</option>
          <option value="admin" style={{ background: '#15375f' }}>Admin</option>
          <option value="management" style={{ background: '#15375f' }}>Pengurusan</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : users.length === 0 ? <EmptyState icon={Users} title="Tiada pengguna" /> : (
        <div className="overflow-x-auto custom-scroll max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="text-left text-white/60 text-xs bg-[#15375f]/80 backdrop-blur-md">
                <th className="py-2 px-3">Nama</th>
                <th className="py-2 px-3">E-mel</th>
                <th className="py-2 px-3">No. Pekerja</th>
                <th className="py-2 px-3">Jabatan</th>
                <th className="py-2 px-3">Peranan</th>
                <th className="py-2 px-3">Log Masuk Terakhir</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-white font-bold text-xs">{u.fullName.charAt(0)}</div>
                      <span className="text-white/90">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-white/70 text-xs">{u.email}</td>
                  <td className="py-2 px-3 text-white/70 text-xs">{u.staffId}</td>
                  <td className="py-2 px-3 text-white/70 text-xs">{u.department}</td>
                  <td className="py-2 px-3">
                    <select
                      className="glass-input px-2 py-1 text-xs"
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="reporter" style={{ background: '#15375f' }}>Pelapor</option>
                      <option value="technician" style={{ background: '#15375f' }}>Juruteknik</option>
                      <option value="admin" style={{ background: '#15375f' }}>Admin</option>
                      <option value="management" style={{ background: '#15375f' }}>Pengurusan</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-white/60 text-xs">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '-'}</td>
                  <td className="py-2 px-3">
                    <span className={`status-badge ${u.isActive ? 'status-selesai' : 'status-hold'}`}>{u.isActive ? 'Aktif' : 'Disekat'}</span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center ${u.isActive ? 'bg-rose-400/15 text-rose-300 hover:bg-rose-400/25' : 'bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25'}`}
                      title={u.isActive ? 'Nyahaktif' : 'Aktifkan'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="glass-subtle p-3 mt-3 flex items-center gap-2 text-xs text-white/60">
        <ShieldCheck className="w-4 h-4 text-cyan-300" />
        <span>Kawalan akses berperanan (RBAC) dilaksanakan pada setiap endpoint API. Perubahan peranan akan mengubah akses pengguna serta-merta.</span>
      </div>
    </GlassCard>
  )
}
