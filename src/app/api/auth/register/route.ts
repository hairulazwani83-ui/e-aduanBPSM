import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { validateEmail, validatePhone, validatePassword, sanitizeString, logAudit, rateLimit, getClientIp } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(`register:${ip}`, 5, 60000) // 5 per minute per IP
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percubaan. Cuba lagi selepas 1 minit.' }, { status: 429 })
    }

    const body = await req.json()
    const { email, password, fullName, staffId, department, phone } = body

    // Validate required
    if (!email || !password || !fullName || !staffId || !department) {
      return NextResponse.json({ error: 'Semua medan wajib diisi.' }, { status: 400 })
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Format e-mel tidak sah.' }, { status: 400 })
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: 'Format nombor telefon tidak sah.' }, { status: 400 })
    }

    // Validate password strength
    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.message }, { status: 400 })
    }

    // Check for existing email
    const existingEmail = await db.profile.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existingEmail) {
      return NextResponse.json({ error: 'E-mel sudah berdaftar. Sila log masuk.' }, { status: 409 })
    }

    // Check for existing staff ID
    const existingStaff = await db.profile.findFirst({ where: { staffId: staffId.trim() } })
    if (existingStaff) {
      return NextResponse.json({ error: 'No. Pekerja sudah berdaftar.' }, { status: 409 })
    }

    // Hash password (bcrypt with 10 rounds)
    const passwordHash = await bcrypt.hash(password, 10)

    // Sanitize inputs
    const safeName = sanitizeString(fullName, 200)
    const safeStaffId = sanitizeString(staffId, 50)
    const safeDepartment = sanitizeString(department, 100)
    const safePhone = phone ? sanitizeString(phone, 20) : null

    // Create profile - default role is reporter (admin assigns other roles)
    const profile = await db.profile.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: safeName,
        staffId: safeStaffId,
        department: safeDepartment,
        phone: safePhone,
        role: 'reporter',
      },
    })

    await logAudit({
      userId: profile.id,
      action: 'REGISTER',
      entity: 'profile',
      entityId: profile.id,
      details: `Pengguna baharu berdaftar: ${profile.email} (${profile.fullName})`,
      ipAddress: ip,
      severity: 'info',
    })

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berjaya. Sila log masuk.',
      profile: { id: profile.id, email: profile.email, fullName: profile.fullName },
    })
  } catch (e: any) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Ralat pelayan. Sila cuba lagi.' }, { status: 500 })
  }
}
