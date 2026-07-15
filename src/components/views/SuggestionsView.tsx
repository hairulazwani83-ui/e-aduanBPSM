'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb, Send, Loader2, MessageSquare, Clock, CheckCircle2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard, SectionTitle, EmptyState, LoadingSpinner } from '@/components/shared/Glass'
import { formatDateTime } from '@/lib/ui-utils'

export default function SuggestionsView({ user }: { user: any }) {
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', category: 'Umum' })
  const [submitting, setSubmitting] = useState(false)
  const [respondTo, setRespondTo] = useState<string | null>(null)
  const [adminResponse, setAdminResponse] = useState('')

  useEffect(() => { fetchSuggestions() }, [])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/suggestions')
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (e) {
      toast.error('Gagal memuatkan data.')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!form.subject || !form.message) {
      toast.error('Subjek dan mesej diperlukan.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Cadangan dihantar!')
        setForm({ subject: '', message: '', category: 'Umum' })
        setShowForm(false)
        fetchSuggestions()
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const respond = async () => {
    if (!adminResponse) {
      toast.error('Respons diperlukan.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/suggestions/${respondTo}/response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse, status: 'Dijawab' }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Respons dihantar!')
        setRespondTo(null)
        setAdminResponse('')
        fetchSuggestions()
      } else {
        toast.error(data.error || 'Gagal.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isAdmin = user.role === 'admin'

  return (
    <div className="space-y-4">
      <GlassCard>
        <SectionTitle
          title="Cadangan & Syor"
          subtitle={isAdmin ? 'Urus dan respons kepada cadangan dari staf' : 'Hantar cadangan untuk peningkatan perkhidmatan Unit ICT'}
          icon={Lightbulb}
          action={
            !isAdmin && (
              <button onClick={() => setShowForm(!showForm)} className="btn-primary-glass px-4 py-1.5 text-sm flex items-center gap-2">
                <Send className="w-4 h-4" /> Hantar Cadangan
              </button>
            )
          }
        />

        {/* New suggestion form (reporter) */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="glass-subtle p-4 mb-4 space-y-3">
                <input
                  className="glass-input w-full px-3 py-2 text-sm"
                  placeholder="Subjek cadangan"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                />
                <select className="glass-input w-full px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="Umum" style={{ background: '#15375f' }}>Umum</option>
                  <option value="Peningkatan" style={{ background: '#15375f' }}>Peningkatan</option>
                  <option value="Aduan Perkhidmatan" style={{ background: '#15375f' }}>Aduan Perkhidmatan</option>
                </select>
                <textarea
                  className="glass-input w-full px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Terangkan cadangan anda..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={submit} disabled={submitting} className="btn-primary-glass px-4 py-1.5 text-sm flex items-center gap-2">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Hantar
                  </button>
                  <button onClick={() => setShowForm(false)} className="btn-glass px-4 py-1.5 text-sm">Batal</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <LoadingSpinner text="Memuatkan..." />
        ) : suggestions.length === 0 ? (
          <EmptyState icon={Lightbulb} title="Tiada Cadangan" subtitle="Cadangan yang dihantar akan dipaparkan di sini." />
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-subtle p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold text-sm">{s.subject}</h4>
                      <span className={`status-badge ${
                        s.status === 'Dijawab' ? 'status-selesai' : s.status === 'Dalam Semakan' ? 'status-dalam' : 'status-baru'
                      }`}>{s.status}</span>
                      <span className="status-badge priority-sederhana">{s.category}</span>
                    </div>
                    <p className="text-white/80 text-sm">{s.message}</p>
                    <div className="text-xs text-white/50 mt-2">
                      Dihantar oleh {s.submittedBy?.fullName} ({s.submittedBy?.department}) · {formatDateTime(s.createdAt)}
                    </div>
                  </div>
                </div>

                {s.adminResponse && (
                  <div className="mt-3 pl-4 border-l-2 border-cyan-400/40">
                    <div className="text-xs text-cyan-300 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Respons Admin
                    </div>
                    <p className="text-white/80 text-sm">{s.adminResponse}</p>
                    {s.respondedAt && <div className="text-xs text-white/40 mt-1">{formatDateTime(s.respondedAt)}</div>}
                  </div>
                )}

                {isAdmin && !s.adminResponse && (
                  <button
                    onClick={() => { setRespondTo(s.id); setAdminResponse('') }}
                    className="mt-2 btn-glass px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" /> Beri Respons
                  </button>
                )}

                {isAdmin && s.adminResponse && (
                  <button
                    onClick={() => { setRespondTo(s.id); setAdminResponse(s.adminResponse) }}
                    className="mt-2 text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    Edit Respons
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Admin response modal */}
      <AnimatePresence>
        {respondTo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRespondTo(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="glass-strong p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Respons Rasmi</h3>
                <button onClick={() => setRespondTo(null)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <textarea
                className="glass-input w-full px-3 py-2 text-sm min-h-[120px] mb-3"
                placeholder="Tulis respons rasmi..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
              />
              <button onClick={respond} disabled={submitting} className="btn-primary-glass w-full py-2 text-sm flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Hantar Respons
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
