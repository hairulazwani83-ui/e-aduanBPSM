/**
 * Helper utilities for frontend
 */

// Status badge class helper
export function getStatusBadgeClass(status: string): string {
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

// Priority badge class helper
export function getPriorityBadgeClass(priority: string): string {
  const p = priority.toLowerCase()
  if (p.includes('rendah')) return 'priority-rendah'
  if (p.includes('sederhana')) return 'priority-sederhana'
  if (p.includes('tinggi')) return 'priority-tinggi'
  if (p.includes('kritikal')) return 'priority-kritikal'
  return 'priority-sederhana'
}

// Format date in Malay
export function formatDate(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ms-MY', opts || { day: '2-digit', month: 'short', year: 'numeric' })
}

// Format date with time
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ms-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Format currency
export function formatRM(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'RM 0.00'
  return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Time ago
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(diff / 3600000)
  const day = Math.floor(diff / 86400000)

  if (min < 1) return 'baru sahaja'
  if (min < 60) return `${min} minit yang lalu`
  if (hr < 24) return `${hr} jam yang lalu`
  if (day < 30) return `${day} hari yang lalu`
  return formatDate(d)
}

// Equipment icons mapping (lucide-react icon names)
export function getEquipmentIcon(iconName: string): string {
  const map: Record<string, string> = {
    Monitor: 'Monitor',
    Laptop: 'Laptop',
    Printer: 'Printer',
    Projector: 'Projector',
    Network: 'Network',
    Router: 'Router',
    Wifi: 'Wifi',
  }
  return map[iconName] || 'Monitor'
}

// Role labels (Malay)
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    reporter: 'Pelapor',
    technician: 'Juruteknik ICT',
    admin: 'Admin ICT',
    management: 'Pengurusan',
  }
  return labels[role] || role
}

// Validate ticket number format
export function isValidTicketNo(ticket: string): boolean {
  return /^ADT-PG-\d{6}-\d{4}$/i.test(ticket)
}

// Status flow order
export const STATUS_FLOW = ['Baru', 'Ditugaskan', 'Dalam Tindakan', 'On Hold', 'Selesai', 'Ditutup']

// Status color dots for timeline
export function getStatusColor(status: string): string {
  switch (status) {
    case 'Baru': return '#5BC0DE'
    case 'Ditugaskan': return '#FFB347'
    case 'Dalam Tindakan': return '#FFD700'
    case 'On Hold': return '#FF6B6B'
    case 'Selesai': return '#4ECDC4'
    case 'Ditutup': return '#B4B4C8'
    default: return '#5BC0DE'
  }
}
