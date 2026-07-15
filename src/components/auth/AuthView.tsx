'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Shield, AlertCircle, Loader2, Eye, EyeOff, Lock, Mail, User,
  Building2, Phone, BadgeCheck,
} from 'lucide-react'

export default function AuthView({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', fullName: '', staffId: '', department: '', phone: '',
  })

  const departments = [
    'Unit ICT', 'Jabatan Elektrik', 'Jabatan Elektronik', 'Jabatan Mekanikal',
    'Jabatan Pengajian Am', 'Pentadbiran', 'Hal Ehwal Pelajar', 'Perpustakaan',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'login') {
        const res = await signIn('credentials', {
          email: form.email,
          password: form.password,
          redirect: false,
        })
        if (res?.error) {
          toast.error('Log masuk gagal. Semak e-mel dan kata laluan anda.')
        } else {
          toast.success('Log masuk berjaya!')
          onAuthSuccess?.()
        }
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Pendaftaran gagal.')
        } else {
          toast.success('Pendaftaran berjaya! Sila log masuk.')
          setMode('login')
          setForm({ ...form, password: '' })
        }
      }
    } catch (err) {
      toast.error('Ralat rangkaian. Cuba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'admin' | 'technician' | 'reporter' | 'management') => {
    const creds = {
      admin: { email: 'admin@adtecpg.edu.my', password: 'Password@123' },
      technician: { email: 'tech1@adtecpg.edu.my', password: 'Password@123' },
      reporter: { email: 'staff1@adtecpg.edu.my', password: 'Password@123' },
      management: { email: 'mgmt@adtecpg.edu.my', password: 'Password@123' },
    }
    setForm({ ...form, ...creds[role], fullName: '', staffId: '', department: '', phone: '' })
    setMode('login')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 z-10">
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="brand-logo">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-lg leading-tight">eAduan ICT</div>
          <div className="text-white/60 text-xs">ADTEC JTM Kampus Pasir Gudang</div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' ? 'Selamat Kembali' : 'Pendaftaran Akaun Baharu'}
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {mode === 'login'
              ? 'Log masuk ke Sistem eAduan Kerosakan ICT'
              : 'Daftar sebagai Pelapor (Staf/Pensyarah)'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <Field icon={<User className="w-4 h-4" />} type="text" placeholder="Nama Penuh" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
              <Field icon={<BadgeCheck className="w-4 h-4" />} type="text" placeholder="No. Pekerja / ID Staf" value={form.staffId} onChange={(v) => setForm({ ...form, staffId: v })} required />
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                <select
                  className="glass-input w-full pl-10 pr-3 py-2.5 text-sm"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  required
                >
                  <option value="" style={{ background: '#15375f' }}>Pilih Jabatan/Unit</option>
                  {departments.map((d) => (
                    <option key={d} value={d} style={{ background: '#15375f' }}>{d}</option>
                  ))}
                </select>
              </div>
              <Field icon={<Phone className="w-4 h-4" />} type="tel" placeholder="No. Telefon (cth: 011-1234567)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </>
          )}

          <Field icon={<Mail className="w-4 h-4" />} type="email" placeholder="E-mel" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />

          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              className="glass-input w-full pl-10 pr-10 py-2.5 text-sm"
              type={showPwd ? 'text' : 'password'}
              placeholder="Kata Laluan"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'register' && (
            <div className="glass-subtle p-2.5 text-xs text-white/60 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-300" />
              <span>Kata laluan mesti ≥8 aksara, mengandungi huruf besar, huruf kecil & nombor.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-glass w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Log Masuk' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          <span className="text-white/60">{mode === 'login' ? 'Belum ada akaun? ' : 'Sudah ada akaun? '}</span>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-cyan-300 hover:text-cyan-200 font-medium">
            {mode === 'login' ? 'Daftar di sini' : 'Log masuk'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center mb-2">Akaun Demo (klik untuk isi):</p>
          <div className="grid grid-cols-2 gap-2">
            <DemoBtn label="Admin" onClick={() => fillDemo('admin')} />
            <DemoBtn label="Juruteknik" onClick={() => fillDemo('technician')} />
            <DemoBtn label="Pelapor" onClick={() => fillDemo('reporter')} />
            <DemoBtn label="Pengurusan" onClick={() => fillDemo('management')} />
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-4 text-center text-xs text-white/40 px-4">
        <p>SULIT / TERHAD — Untuk kegunaan dalaman ADTEC JTM Kampus Pasir Gudang sahaja</p>
        <p className="mt-1">v1.0 · Disediakan oleh Unit ICT · © 2026 Jabatan Tenaga Manusia</p>
      </div>
    </div>
  )
}

function Field({ icon, type, placeholder, value, onChange, required }: {
  icon: React.ReactNode; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">{icon}</span>
      <input
        className="glass-input w-full pl-10 pr-3 py-2.5 text-sm"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  )
}

function DemoBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass-subtle hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs text-white/80 transition">
      {label}
    </button>
  )
}
