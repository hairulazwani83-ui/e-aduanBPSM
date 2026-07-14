'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, PlusCircle, Ticket, Lightbulb, User as UserIcon,
  Wrench, ClipboardList, Settings, FileText, ScrollText, Bell, LogOut,
  ChevronDown, Menu, X, Search, Building, Cpu, AlertTriangle, ShieldCheck,
  Monitor, BarChart3, Users,
} from 'lucide-react'
import { toast } from 'sonner'

interface AppUser {
  id: string
  email: string
  fullName: string
  staffId: string
  department: string
  phone?: string | null
  role: string
  isActive: boolean
  lastLoginAt?: string | null
  createdAt?: string
  unreadCount?: number
}

interface NavItemDef {
  id: string
  label: string
  icon: any
  roles: string[]
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Papan Pemuka', icon: LayoutDashboard, roles: ['reporter', 'technician', 'admin', 'management'] },
  { id: 'new-complaint', label: 'Buat Aduan Baharu', icon: PlusCircle, roles: ['reporter', 'admin'] },
  { id: 'my-tickets', label: 'Tiket Saya', icon: Ticket, roles: ['reporter'] },
  { id: 'all-complaints', label: 'Semua Aduan', icon: ClipboardList, roles: ['admin', 'management'] },
  { id: 'assigned', label: 'Tugasan Saya', icon: Wrench, roles: ['technician'] },
  { id: 'track-ticket', label: 'Jejak Tiket', icon: Search, roles: ['reporter', 'technician'] },
  { id: 'suggestions', label: 'Cadangan & Syor', icon: Lightbulb, roles: ['reporter', 'admin'] },
  { id: 'reports', label: 'Laporan Bulanan', icon: FileText, roles: ['admin', 'management'] },
  { id: 'manage-equipment', label: 'Jenis Peralatan', icon: Monitor, roles: ['admin'] },
  { id: 'manage-damage', label: 'Kategori Kerosakan', icon: AlertTriangle, roles: ['admin'] },
  { id: 'manage-assets', label: 'Aset ICT', icon: Cpu, roles: ['admin', 'management'] },
  { id: 'manage-users', label: 'Pengguna', icon: Users, roles: ['admin'] },
  { id: 'audit-log', label: 'Log Audit', icon: ScrollText, roles: ['admin'] },
  { id: 'profile', label: 'Profil Saya', icon: UserIcon, roles: ['reporter', 'technician', 'admin', 'management'] },
]

const ROLE_LABEL: Record<string, string> = {
  reporter: 'Pelapor',
  technician: 'Juruteknik ICT',
  admin: 'Admin ICT',
  management: 'Pengurusan',
}

export default function AppShell({
  user, activeView, onChangeView, children,
}: {
  user: AppUser
  activeView: string
  onChangeView: (v: string) => void
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const allowedItems = NAV_ITEMS.filter((n) => n.roles.includes(user.role))

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (e) {}
  }

  useEffect(() => {
    let mounted = true
    const doFetch = async () => {
      try {
        const res = await fetch('/api/notifications?limit=10')
        if (res.ok && mounted) {
          const data = await res.json()
          setNotifications(data.notifications || [])
        }
      } catch (e) {}
    }
    doFetch()
    const interval = setInterval(doFetch, 30000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  // Click outside handlers
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllAsRead: true }),
    })
    fetchNotifications()
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast.success('Anda telah log keluar.')
    setTimeout(() => window.location.reload(), 500)
  }

  return (
    <div className="min-h-screen flex relative z-10">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 z-40 lg:z-10 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full m-3 mr-0 lg:mr-3 glass-card p-4 flex flex-col">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="brand-logo">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-base leading-tight">eAduan ICT</div>
              <div className="text-white/60 text-xs truncate">ADTEC JTM Pasir Gudang</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto custom-scroll space-y-1 pr-1">
            {allowedItems.map((item) => {
              const Icon = item.icon
              const active = activeView === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { onChangeView(item.id); setSidebarOpen(false) }}
                  className={`nav-item w-full ${active ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Security badge */}
          <div className="glass-subtle p-3 mt-4 flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="w-4 h-4 text-cyan-300 flex-shrink-0" />
            <span>Sesi disahkan & disulitkan (HTTPS/JWT/RLS)</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 p-3">
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/70 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1">
              <h1 className="text-white font-semibold text-lg leading-tight">
                {allowedItems.find((n) => n.id === activeView)?.label || 'Papan Pemuka'}
              </h1>
              <p className="text-white/50 text-xs">{new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications() }}
                className="relative w-10 h-10 rounded-xl glass-subtle hover:bg-white/10 flex items-center justify-center text-white/80"
              >
                <Bell className="w-5 h-5" />
                {user.unreadCount && user.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {user.unreadCount > 9 ? '9+' : user.unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-12 w-80 glass-strong p-3 z-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold text-sm">Notifikasi</h3>
                      <button onClick={markAllRead} className="text-xs text-cyan-300 hover:text-cyan-200">Tanda semua dibaca</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scroll space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-white/50 text-sm text-center py-4">Tiada notifikasi</p>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-2.5 rounded-lg ${n.isRead ? 'bg-white/3' : 'bg-cyan-400/10 border border-cyan-400/20'}`}>
                            <div className="text-white text-sm font-medium">{n.title}</div>
                            <div className="text-white/60 text-xs mt-0.5">{n.message}</div>
                            <div className="text-white/40 text-[10px] mt-1">{new Date(n.createdAt).toLocaleString('ms-MY')}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 glass-subtle hover:bg-white/10 px-2.5 py-1.5 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-white text-xs font-medium leading-tight max-w-[140px] truncate">{user.fullName}</div>
                  <div className="text-white/50 text-[10px]">{ROLE_LABEL[user.role]}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-white/60" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-14 w-64 glass-strong p-3 z-50"
                  >
                    <div className="text-center pb-3 border-b border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-white font-semibold text-sm">{user.fullName}</div>
                      <div className="text-white/60 text-xs">{user.email}</div>
                      <div className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 text-[10px]">
                        {ROLE_LABEL[user.role]} · {user.department}
                      </div>
                    </div>
                    <div className="py-2 space-y-1">
                      <button onClick={() => { onChangeView('profile'); setProfileOpen(false) }} className="nav-item w-full">
                        <UserIcon className="w-4 h-4" /> <span>Profil Saya</span>
                      </button>
                      <button onClick={handleSignOut} className="nav-item w-full text-rose-300 hover:text-rose-200">
                        <LogOut className="w-4 h-4" /> <span>Log Keluar</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 pt-0 overflow-x-hidden">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>

        <footer className="px-4 py-3 text-center text-xs text-white/40">
          <p>Sistem eAduan Kerosakan ICT v1.0 · © 2026 ADTEC JTM Kampus Pasir Gudang · Jabatan Tenaga Manusia</p>
        </footer>
      </div>
    </div>
  )
}
