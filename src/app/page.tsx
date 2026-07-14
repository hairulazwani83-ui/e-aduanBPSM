'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import AuthView from '@/components/auth/AuthView'
import AppShell from '@/components/shared/AppShell'
import DashboardView from '@/components/views/DashboardView'
import NewComplaintView from '@/components/views/NewComplaintView'
import ComplaintListView from '@/components/views/ComplaintListView'
import TrackTicketView from '@/components/views/TrackTicketView'
import SuggestionsView from '@/components/views/SuggestionsView'
import ReportsView from '@/components/views/ReportsView'
import ProfileView from '@/components/views/ProfileView'
import ManageEquipmentView from '@/components/views/ManageEquipmentView'
import ManageDamageView from '@/components/views/ManageDamageView'
import ManageAssetsView from '@/components/views/ManageAssetsView'
import ManageUsersView from '@/components/views/ManageUsersView'
import AuditLogView from '@/components/views/AuditLogView'

export default function Home() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUser()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Memuatkan Sistem eAduan ICT...</p>
        </div>
      </div>
    )
  }

  // Not authenticated → show auth view
  if (!session || !user) {
    return <AuthView onAuthSuccess={fetchUser} />
  }

  // Default view by role
  const defaultView = user.role === 'reporter' ? 'dashboard' : 'dashboard'

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView user={user} />
      case 'new-complaint':
        return <NewComplaintView user={user} onCreated={() => setActiveView('my-tickets')} />
      case 'my-tickets':
        return <ComplaintListView user={user} scope="mine" />
      case 'all-complaints':
        return <ComplaintListView user={user} scope="all" />
      case 'assigned':
        return <ComplaintListView user={user} scope="assigned" />
      case 'track-ticket':
        return <TrackTicketView />
      case 'suggestions':
        return <SuggestionsView user={user} />
      case 'reports':
        return <ReportsView user={user} />
      case 'manage-equipment':
        return <ManageEquipmentView />
      case 'manage-damage':
        return <ManageDamageView />
      case 'manage-assets':
        return <ManageAssetsView user={user} />
      case 'manage-users':
        return <ManageUsersView />
      case 'audit-log':
        return <AuditLogView />
      case 'profile':
        return <ProfileView user={user} />
      default:
        return <DashboardView user={user} />
    }
  }

  return (
    <AppShell user={user} activeView={activeView} onChangeView={setActiveView}>
      {renderView()}
    </AppShell>
  )
}
