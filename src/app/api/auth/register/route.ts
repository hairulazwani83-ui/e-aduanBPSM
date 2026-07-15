import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { validateEmail, validatePhone, validatePassword, sanitizeString, logAudit, rateLimit, getClientIp } from '@/lib/security'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(`register:${ip}`, 5, 60000)
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Terlalu banyak percubaan. Cuba lagi selepas 1 minit.' }, { status: 429 })
    }

    const body = await req.json()
    const { email, password, fullName, staffId, department, phone } = body

    if (!email || !password || !fullName || !staffId || !department) {
      return NextResponse.json({ error: 'Semua medan wajib diisi.' }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Format e-mel tidak sah.' }, { status: 400 })
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: 'Format nombor telefon tidak sah.' }, { status: 400 })
    }

    const pwdCheck = validatePassword(password)
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.message }, { status: 400 })
    }

    const existingEmail = await db.profile.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existingEmail) {
      return NextResponse.json({ error: 'E-mel sudah berdaftar. Sila log masuk.' }, { status: 409 })
    }

    const existingStaff = await db.profile.findFirst({ where: { staffId: staffId.trim() } })
    if (existingStaff) {
      return NextResponse.json({ error: 'No. Pekerja sudah berdaftar.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const safeName = sanitizeString(fullName, 200)
    const safeStaffId = sanitizeString(staffId, 50)
    const safeDepartment = sanitizeString(department, 100)
    const safePhone = phone ? sanitizeString(phone, 20) : null

    // Create profile - default role is REPORTER enum
    const profile = await db.profile.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: safeName,
        staffId: safeStaffId,
        department: safeDepartment,
        phone: safePhone,
        role: Role.REPORTER,
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
