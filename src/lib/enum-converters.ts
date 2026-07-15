/**
 * String-to-Enum converters for Prisma
 * Frontend uses Malay strings; DB stores uppercase enums
 */
import {
  Role, Priority, ComplaintStatus, AssetStatus,
  SuggestionCategory, SuggestionStatus, NotificationType, Severity,
} from '@prisma/client'

// ==================== String → Enum ====================
export function toRole(s: string): Role {
  const r = (s || '').toLowerCase()
  if (r === 'admin') return Role.ADMIN
  if (r === 'technician') return Role.TECHNICIAN
  if (r === 'management') return Role.MANAGEMENT
  return Role.REPORTER
}

export function toPriority(s: string): Priority {
  const p = (s || '').toLowerCase()
  if (p.includes('rendah')) return Priority.RENDAH
  if (p.includes('tinggi')) return Priority.TINGGI
  if (p.includes('kritikal')) return Priority.KRITIKAL
  return Priority.SEDERHANA
}

export function toComplaintStatus(s: string): ComplaintStatus {
  const st = (s || '').toLowerCase()
  if (st === 'baru') return ComplaintStatus.BARU
  if (st.includes('ditugaskan')) return ComplaintStatus.DITUGASKAN
  if (st.includes('dalam')) return ComplaintStatus.DALAM_TINDAKAN
  if (st.includes('hold')) return ComplaintStatus.ON_HOLD
  if (st.includes('selesai')) return ComplaintStatus.SELESAI
  if (st.includes('ditutup')) return ComplaintStatus.DITUTUP
  return ComplaintStatus.BARU
}

export function toAssetStatus(s: string): AssetStatus {
  const st = (s || '').toLowerCase()
  if (st.includes('rosak')) return AssetStatus.ROSAK
  if (st.includes('dilupus')) return AssetStatus.DILUPUS
  return AssetStatus.AKTIF
}

export function toSuggestionCategory(s: string): SuggestionCategory {
  if (s === 'Peningkatan') return SuggestionCategory.PENINGKATAN
  if (s === 'Aduan Perkhidmatan') return SuggestionCategory.ADUAN_PERKHIDMATAN
  return SuggestionCategory.UMUM
}

export function toSuggestionStatus(s: string): SuggestionStatus {
  if (s === 'Dijawab') return SuggestionStatus.DIJAWAB
  if (s.includes('Semakan')) return SuggestionStatus.DALAM_SEMAKAN
  return SuggestionStatus.BARU
}

export function toNotificationType(s: string): NotificationType {
  if (s === 'success') return NotificationType.SUCCESS
  if (s === 'warning') return NotificationType.WARNING
  if (s === 'error') return NotificationType.ERROR
  return NotificationType.INFO
}

export function toSeverity(s: string): Severity {
  if (s === 'warning') return Severity.WARNING
  if (s === 'critical') return Severity.CRITICAL
  return Severity.INFO
}

// ==================== Enum → String (for API responses) ====================
export function fromRole(r: Role): string {
  return r.toLowerCase()
}

export function fromPriority(p: Priority): string {
  // Capitalize first letter
  const map: Record<Priority, string> = {
    [Priority.RENDAH]: 'Rendah',
    [Priority.SEDERHANA]: 'Sederhana',
    [Priority.TINGGI]: 'Tinggi',
    [Priority.KRITIKAL]: 'Kritikal',
  }
  return map[p]
}

export function fromComplaintStatus(s: ComplaintStatus): string {
  const map: Record<ComplaintStatus, string> = {
    [ComplaintStatus.BARU]: 'Baru',
    [ComplaintStatus.DITUGASKAN]: 'Ditugaskan',
    [ComplaintStatus.DALAM_TINDAKAN]: 'Dalam Tindakan',
    [ComplaintStatus.ON_HOLD]: 'On Hold',
    [ComplaintStatus.SELESAI]: 'Selesai',
    [ComplaintStatus.DITUTUP]: 'Ditutup',
  }
  return map[s]
}

export function fromAssetStatus(s: AssetStatus): string {
  const map: Record<AssetStatus, string> = {
    [AssetStatus.AKTIF]: 'Aktif',
    [AssetStatus.ROSAK]: 'Rosak',
    [AssetStatus.DILUPUS]: 'Dilupus',
  }
  return map[s]
}

export function fromSuggestionCategory(c: SuggestionCategory): string {
  const map: Record<SuggestionCategory, string> = {
    [SuggestionCategory.UMUM]: 'Umum',
    [SuggestionCategory.PENINGKATAN]: 'Peningkatan',
    [SuggestionCategory.ADUAN_PERKHIDMATAN]: 'Aduan Perkhidmatan',
  }
  return map[c]
}

export function fromSuggestionStatus(s: SuggestionStatus): string {
  const map: Record<SuggestionStatus, string> = {
    [SuggestionStatus.BARU]: 'Baru',
    [SuggestionStatus.DALAM_SEMAKAN]: 'Dalam Semakan',
    [SuggestionStatus.DIJAWAB]: 'Dijawab',
  }
  return map[s]
}

export function fromNotificationType(t: NotificationType): string {
  return t.toLowerCase()
}

/**
 * Serialize a Prisma complaint record for API response - converts enums to frontend strings
 */
export function serializeComplaint(c: any): any {
  if (!c) return c
  return {
    ...c,
    priority: c.priority ? fromPriority(c.priority) : c.priority,
    status: c.status ? fromComplaintStatus(c.status) : c.status,
    damageCategory: c.damageCategory ? {
      ...c.damageCategory,
      defaultPriority: c.damageCategory.defaultPriority ? fromPriority(c.damageCategory.defaultPriority) : c.damageCategory.defaultPriority,
    } : c.damageCategory,
    asset: c.asset ? {
      ...c.asset,
      status: c.asset.status ? fromAssetStatus(c.asset.status) : c.asset.status,
    } : c.asset,
    workLogs: c.workLogs ? c.workLogs.map((w: any) => ({ ...w, cost: Number(w.cost) })) : c.workLogs,
  }
}

export function serializeProfile(p: any): any {
  if (!p) return p
  return {
    ...p,
    role: p.role ? fromRole(p.role) : p.role,
  }
}

export function serializeSuggestion(s: any): any {
  if (!s) return s
  return {
    ...s,
    category: s.category ? fromSuggestionCategory(s.category) : s.category,
    status: s.status ? fromSuggestionStatus(s.status) : s.status,
  }
}

export function serializeEquipmentType(e: any): any {
  if (!e) return e
  return e
}

export function serializeAsset(a: any): any {
  if (!a) return a
  return {
    ...a,
    status: a.status ? fromAssetStatus(a.status) : a.status,
  }
}
