/**
 * Sistem eAduan Kerosakan ICT - ADTEC JTM Kampus Pasir Gudang
 * Seed Script - Comprehensive dummy data for demo/UAT
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const DEPARTMENTS = [
  'Unit ICT',
  'Jabatan Elektrik',
  'Jabatan Elektronik',
  'Jabatan Mekanikal',
  'Jabatan Pengajian Am',
  'Pentadbiran',
  'Hal Ehwal Pelajar',
  'Perpustakaan',
]

const LOCATIONS = [
  'Blok A - Bilik Kuliah 1',
  'Blok A - Bilik Kuliah 2',
  'Blok A - Makmal Komputer 1',
  'Blok A - Makmal Komputer 2',
  'Blok B - Bengkel Elektrik',
  'Blok B - Bengkel Elektronik',
  'Blok B - Bengkel Mekanikal',
  'Blok C - Pejabat Pentadbiran',
  'Blok C - Bilik Staf',
  'Blok D - Perpustakaan',
  'Blok D - Bilik Pensyarah',
  'Blok E - Makmal Rangkaian',
  'Blok E - Pusat Komputer',
  'Auditorium',
  'Surau',
  'Kafeteria',
]

async function main() {
  console.log('🧹 Cleaning existing data...')
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.complaintRating.deleteMany()
  await db.workLog.deleteMany()
  await db.statusHistory.deleteMany()
  await db.suggestion.deleteMany()
  await db.complaint.deleteMany()
  await db.asset.deleteMany()
  await db.damageCategory.deleteMany()
  await db.equipmentType.deleteMany()
  await db.profile.deleteMany()

  // ==================== Equipment Types (FR-1) ====================
  console.log('📋 Seeding equipment types...')
  const equipmentTypes = await Promise.all([
    db.equipmentType.create({ data: { code: 'EQ-01', name: 'Komputer Meja (Desktop PC)', icon: 'Monitor' } }),
    db.equipmentType.create({ data: { code: 'EQ-02', name: 'Komputer Riba (Laptop)', icon: 'Laptop' } }),
    db.equipmentType.create({ data: { code: 'EQ-03', name: 'Mesin Pencetak (Printer)', icon: 'Printer' } }),
    db.equipmentType.create({ data: { code: 'EQ-04', name: 'LCD Projektor', icon: 'Projector' } }),
    db.equipmentType.create({ data: { code: 'EQ-05', name: 'Network Switch', icon: 'Network' } }),
    db.equipmentType.create({ data: { code: 'EQ-06', name: 'Router', icon: 'Router' } }),
    db.equipmentType.create({ data: { code: 'EQ-07', name: 'WiFi Access Point (AP)', icon: 'Wifi' } }),
  ])
  const eqByCode = Object.fromEntries(equipmentTypes.map((e) => [e.code, e]))

  // ==================== Damage Categories (FR-2) ====================
  console.log('📋 Seeding damage categories...')
  const damageCategories = await Promise.all([
    db.damageCategory.create({
      data: {
        name: 'Perkakasan (Hardware)',
        description: 'Tidak boleh hidup, bunyi bising, kerosakan fizikal, port rosak',
        defaultPriority: 'Tinggi',
      },
    }),
    db.damageCategory.create({
      data: {
        name: 'Perisian (Software)',
        description: 'Sistem operasi hang/crash, ralat aplikasi, virus/malware',
        defaultPriority: 'Sederhana',
      },
    }),
    db.damageCategory.create({
      data: {
        name: 'Rangkaian (Network)',
        description: 'Tiada sambungan internet, WiFi lemah/putus, IP conflict',
        defaultPriority: 'Tinggi',
      },
    }),
    db.damageCategory.create({
      data: {
        name: 'Pencetakan (Printing)',
        description: 'Jem kertas, dakwat/toner habis, tidak dapat mencetak',
        defaultPriority: 'Rendah',
      },
    }),
    db.damageCategory.create({
      data: {
        name: 'Paparan (Display)',
        description: 'Projektor tiada imej, warna pudar, lampu projektor rosak',
        defaultPriority: 'Sederhana',
      },
    }),
    db.damageCategory.create({
      data: {
        name: 'Lain-lain',
        description: 'Kategori bebas untuk kes tidak standard',
        defaultPriority: 'Rendah',
      },
    }),
  ])
  const catByName = Object.fromEntries(damageCategories.map((c) => [c.name, c]))

  // ==================== Profiles (15 users with mixed roles) ====================
  console.log('👥 Seeding profiles...')
  const password = await bcrypt.hash('Password@123', 10)
  const usersData = [
    // Admin (2)
    { email: 'admin@adtecpg.edu.my', fullName: 'Mohd Aizat bin Rahman', staffId: 'ADT-ADMIN-001', department: 'Unit ICT', phone: '019-2345678', role: 'admin' },
    { email: 'admin2@adtecpg.edu.my', fullName: 'Nurul Huda binti Ismail', staffId: 'ADT-ADMIN-002', department: 'Unit ICT', phone: '019-3456789', role: 'admin' },
    // Technicians (3)
    { email: 'tech1@adtecpg.edu.my', fullName: 'Ahmad Faizal bin Osman', staffId: 'ADT-TECH-001', department: 'Unit ICT', phone: '012-1112223', role: 'technician' },
    { email: 'tech2@adtecpg.edu.my', fullName: 'Siti Aishah binti Yusof', staffId: 'ADT-TECH-002', department: 'Unit ICT', phone: '012-2223334', role: 'technician' },
    { email: 'tech3@adtecpg.edu.my', fullName: 'Lim Wei Ming', staffId: 'ADT-TECH-003', department: 'Unit ICT', phone: '012-3334445', role: 'technician' },
    // Management (2)
    { email: 'mgmt@adtecpg.edu.my', fullName: 'Hj. Ramli bin Hassan', staffId: 'ADT-MGMT-001', department: 'Pentadbiran', phone: '013-1111111', role: 'management' },
    { email: 'mgmt2@adtecpg.edu.my', fullName: 'Pn. Norhazliza binti Zakaria', staffId: 'ADT-MGMT-002', department: 'Pentadbiran', phone: '013-2222222', role: 'management' },
    // Reporters (8)
    { email: 'staff1@adtecpg.edu.my', fullName: 'Rajesh a/l Kumar', staffId: 'ADT-STF-001', department: 'Jabatan Elektrik', phone: '011-1234567', role: 'reporter' },
    { email: 'staff2@adtecpg.edu.my', fullName: 'Fatimah binti Abdullah', staffId: 'ADT-STF-002', department: 'Jabatan Elektronik', phone: '011-2345678', role: 'reporter' },
    { email: 'staff3@adtecpg.edu.my', fullName: 'Tan Chee Keong', staffId: 'ADT-STF-003', department: 'Jabatan Mekanikal', phone: '011-3456789', role: 'reporter' },
    { email: 'staff4@adtecpg.edu.my', fullName: 'Aishah binti Mohamed', staffId: 'ADT-STF-004', department: 'Jabatan Pengajian Am', phone: '011-4567890', role: 'reporter' },
    { email: 'staff5@adtecpg.edu.my', fullName: 'Kumar a/l Subramaniam', staffId: 'ADT-STF-005', department: 'Pentadbiran', phone: '011-5678901', role: 'reporter' },
    { email: 'staff6@adtecpg.edu.my', fullName: 'Wong Mei Ling', staffId: 'ADT-STF-006', department: 'Hal Ehwal Pelajar', phone: '011-6789012', role: 'reporter' },
    { email: 'staff7@adtecpg.edu.my', fullName: 'Mohd Hafiz bin Ibrahim', staffId: 'ADT-STF-007', department: 'Perpustakaan', phone: '011-7890123', role: 'reporter' },
    { email: 'staff8@adtecpg.edu.my', fullName: 'Geetha a/p Raju', staffId: 'ADT-STF-008', department: 'Unit ICT', phone: '011-8901234', role: 'reporter' },
  ]

  const profiles = await Promise.all(
    usersData.map((u) =>
      db.profile.create({
        data: { ...u, passwordHash: password, lastLoginAt: new Date() },
      })
    )
  )
  const admins = profiles.filter((p) => p.role === 'admin')
  const technicians = profiles.filter((p) => p.role === 'technician')
  const reporters = profiles.filter((p) => p.role === 'reporter')

  // ==================== Assets (40 records) ====================
  console.log('🖨️  Seeding assets...')
  const brands = {
    'EQ-01': ['Dell OptiPlex 7090', 'HP EliteDesk 800', 'Lenovo ThinkCentre M90'],
    'EQ-02': ['Dell Latitude 5420', 'HP ProBook 450', 'Lenovo ThinkPad T14', 'Asus ExpertBook'],
    'EQ-03': ['HP LaserJet Pro M404', 'Canon imageCLASS LBP226', 'Epson EcoTank L3250', 'Brother DCP-T720W'],
    'EQ-04': ['Epson EB-X51', 'BenQ MW560', 'Optoma EH460'],
    'EQ-05': ['Cisco SG250-24', 'TP-Link TL-SG1024', 'Dell N1108T-ON'],
    'EQ-06': ['Cisco RV340', 'TP-Link ER7206', 'MikroTik RB2011'],
    'EQ-07': ['TP-Link EAP670', 'UniFi U6-Pro', 'Aruba Instant On AP22'],
  }
  const assetStatuses = ['Aktif', 'Aktif', 'Aktif', 'Aktif', 'Rosak', 'Aktif', 'Aktif', 'Aktif', 'Dilupus', 'Aktif']
  const assets = []
  for (let i = 0; i < 40; i++) {
    const eqCodes = Object.keys(brands)
    const eqCode = eqCodes[i % eqCodes.length]
    const brandList = brands[eqCode]
    const brandModel = brandList[i % brandList.length]
    const location = LOCATIONS[i % LOCATIONS.length]
    const status = assetStatuses[i % assetStatuses.length]
    const asset = await db.asset.create({
      data: {
        assetTag: `AST-${String(i + 1).padStart(4, '0')}`,
        equipmentTypeId: eqByCode[eqCode].id,
        brandModel,
        location,
        purchaseDate: new Date(2020 + (i % 5), i % 12, (i % 28) + 1),
        status,
      },
    })
    assets.push(asset)
  }

  // ==================== Complaints (80-100 records spread across 6 months) ====================
  console.log('🎫 Seeding complaints...')
  const statuses = ['Baru', 'Ditugaskan', 'Dalam Tindakan', 'On Hold', 'Selesai', 'Ditutup']
  const priorities = ['Rendah', 'Sederhana', 'Tinggi', 'Kritikal']
  const statusWeights = [10, 15, 20, 5, 25, 25]

  const descriptions = {
    'Perkakasan (Hardware)': [
      'Komputer tidak dapat dihidupkan. Tiada lampu indicator pada CPU.',
      'Monitor tidak papar apa-apa walaupun CPU hidup. Cable sudah diperiksa.',
      'Bunyi bising dari CPU seperti kipas rosak. Berlaku setiap kali digunakan.',
      'Port USB hadapan tidak berfungsi. Dah cuba beberapa peranti.',
      'Keyboard beberapa kekunci tidak berfungsi terutama kekunci huruf.',
      'Mouse tidak dikesan oleh sistem. Lampu laser off.',
      'Layar laptop bergetar dan ada garis horizontal hijau.',
      'Bateri laptop cepat habis, hanya tahan 30 minit selepas dicas penuh.',
    ],
    'Perisian (Software)': [
      'Windows hang selepas login. Perlu restart beberapa kali.',
      'Microsoft Word crash setiap kali cuba save dokumen besar.',
      'Antivirus Kaspersky tidak dapat update. Ralat sambungan.',
      'Sistem operasi lambat sangat. Startup mengambil lebih 5 minit.',
      'Aplikasi AutoCAD crash semasa render 3D model.',
      'Blue screen error berlaku kerap kali. Code: IRQL_NOT_LESS_OR_EQUAL.',
      'Software photoshop tidak boleh buka fail RAW.',
    ],
    'Rangkaian (Network)': [
      'Tiada sambungan internet di makmal komputer 2. Semua PC terjejas.',
      'WiFi lemah di Blok B. Sering terputus ketika pengajaran.',
      'IP conflict berlaku di antara beberapa PC di pejabat.',
      'Tidak boleh akses serverFail. Connection timeout.',
      'Rangkaian LAN pada satu switch mati sepenuhnya.',
      'WiFi connection dropped di auditorium semasa mesyuarat.',
      'Tidak dapat mencetak melalui rangkaian. Printer tidak dikesan.',
    ],
    'Pencetakan (Printing)': [
      'Printer LaserJet jem kertas. Dah cuba clear tapi berulang.',
      'Toner habis. Hasil cetakan pudar dan tidak boleh dibaca.',
      'Printer tidak dapat dikesan oleh PC dalam rangkaian.',
      'Cetakan bergaris-garis dan warna tidak sekata.',
      'Printer error E3 - tidak boleh resume selepas paper jam.',
      'Scanner function tidak berfungsi pada printer multifungsi.',
    ],
    'Paparan (Display)': [
      'Projektor tiada imej walaupun lampu hidup. Sudah periksa kabel HDMI.',
      'Warna projektor pudar. Korelasi warna tidak tepat.',
      'Lampu projektor rosak. Perlu ganti segera untuk kuliah.',
      'Projektor remote control tidak berfungsi. Bateri sudah ditukar.',
      'Paparan projektor berkedip-kedip sepanjang sesi.',
      'Keystoning teruk, tidak dapat adjust walaupun dengan remote.',
    ],
    'Lain-lain': [
      'UPS berbunyi bip berterusan. Mungkin bateri perlu ganti.',
      'Webcam tidak dikesan untuk sesi Google Meet.',
      'Headset microphone tiada bunyi. Dah cuba pada port lain.',
      'Smart TV di auditorium tidak boleh connect ke WiFi.',
      'Speaker bluetooth tidak pair dengan PC.',
      'CCTV di blok B offline sejak 3 hari lepas.',
    ],
  }

  const complaints = []
  const now = new Date()
  let ticketSeq = 1

  for (let i = 0; i < 95; i++) {
    const monthsAgo = Math.floor(Math.random() * 6)
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 8) + 8, Math.floor(Math.random() * 60))
    if (monthDate > now) monthDate.setTime(now.getTime() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))

    const yearMonth = `${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    const ticketNo = `ADT-PG-${yearMonth}-${String(ticketSeq).padStart(4, '0')}`
    ticketSeq++

    const reporter = reporters[Math.floor(Math.random() * reporters.length)]
    const catIdx = Math.floor(Math.random() * damageCategories.length)
    const category = damageCategories[catIdx]
    const descList = descriptions[category.name] || ['Kerosakan perlu diperiksa.']
    const description = descList[Math.floor(Math.random() * descList.length)]

    let eqCode = 'EQ-01'
    if (category.name.includes('Rangkaian')) eqCode = ['EQ-05', 'EQ-06', 'EQ-07'][Math.floor(Math.random() * 3)]
    else if (category.name.includes('Pencetakan')) eqCode = 'EQ-03'
    else if (category.name.includes('Paparan')) eqCode = 'EQ-04'
    else if (category.name.includes('Perkakasan')) eqCode = ['EQ-01', 'EQ-02'][Math.floor(Math.random() * 2)]
    else eqCode = ['EQ-01', 'EQ-02', 'EQ-03', 'EQ-04'][Math.floor(Math.random() * 4)]

    const equipmentType = eqByCode[eqCode]
    const matchingAssets = assets.filter((a) => a.equipmentTypeId === equipmentType.id)
    const asset = matchingAssets.length > 0 ? matchingAssets[Math.floor(Math.random() * matchingAssets.length)] : null

    const weightTotal = statusWeights.reduce((a, b) => a + b, 0)
    let r = Math.random() * weightTotal
    let status = 'Baru'
    for (let j = 0; j < statuses.length; j++) {
      r -= statusWeights[j]
      if (r <= 0) { status = statuses[j]; break }
    }

    const priority = category.defaultPriority === 'Kritikal' ? 'Kritikal' : priorities[Math.floor(Math.random() * priorities.length)]

    const technician = (status !== 'Baru') ? technicians[Math.floor(Math.random() * technicians.length)] : null
    const assignedAt = technician ? new Date(monthDate.getTime() + 3600000 * 2) : null
    const resolvedAt = (status === 'Selesai' || status === 'Ditutup') ? new Date(monthDate.getTime() + 3600000 * 24 * (1 + Math.floor(Math.random() * 5))) : null
    const closedAt = status === 'Ditutup' ? new Date((resolvedAt || monthDate).getTime() + 3600000 * 24) : null

    const location = asset?.location || LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)]

    const complaint = await db.complaint.create({
      data: {
        ticketNo,
        reporterId: reporter.id,
        equipmentTypeId: equipmentType.id,
        assetId: asset?.id || null,
        damageCategoryId: category.id,
        description,
        aiSuggestedCategory: category.name,
        aiSuggestedPriority: priority,
        aiSolution: 'Sila semak sambungan kabel dan restart peranti terlebih dahulu.',
        priority,
        location,
        status,
        assignedTo: technician?.id || null,
        assignedAt,
        resolvedAt,
        closedAt,
        reporterRating: (status === 'Selesai' || status === 'Ditutup') ? (3 + Math.floor(Math.random() * 3)) : null,
        reporterFeedback: (status === 'Ditutup' && Math.random() > 0.5) ? 'Pelayanan baik dan pantas.' : null,
        createdAt: monthDate,
        updatedAt: resolvedAt || monthDate,
      },
    })
    complaints.push(complaint)

    const history = [{ status: 'Baru', date: monthDate }]
    if (technician) history.push({ status: 'Ditugaskan', date: assignedAt })
    if (status === 'Dalam Tindakan' || ['On Hold', 'Selesai', 'Ditutup'].includes(status)) {
      history.push({ status: 'Dalam Tindakan', date: new Date((assignedAt || monthDate).getTime() + 3600000 * 3) })
    }
    if (status === 'On Hold') {
      history.push({ status: 'On Hold', date: new Date((assignedAt || monthDate).getTime() + 3600000 * 24) })
    }
    if (resolvedAt) history.push({ status: 'Selesai', date: resolvedAt })
    if (closedAt) history.push({ status: 'Ditutup', date: closedAt })

    for (let h = 1; h < history.length; h++) {
      const changer = h === 1 ? admins[Math.floor(Math.random() * admins.length)] : (technician || admins[0])
      await db.statusHistory.create({
        data: {
          complaintId: complaint.id,
          oldStatus: history[h - 1].status,
          newStatus: history[h].status,
          changedById: changer.id,
          changedAt: history[h].date,
          note: `Status ditukar kepada ${history[h].status}`,
        },
      })
    }

    if (resolvedAt) {
      const workActions = [
        'Pemeriksaan awal dibuat. Mendapati komponen rosak dan diganti.',
        'Pembersihan dan penentukuran peranti. Sistem berfungsi normal.',
        'Penggantian spare part dan ujian fungsi penuh.',
        'Software di reinstall dan update driver terkini.',
        'Konfigurasi rangkaian semula. Sambungan stabil.',
        'Penggantian kabel dan port repair.',
        'Penyelesaian remote melalui TeamViewer. Berjaya.',
      ]
      const numLogs = 1 + Math.floor(Math.random() * 2)
      for (let wl = 0; wl < numLogs; wl++) {
        const logDate = new Date(monthDate.getTime() + 3600000 * 24 * (wl + 1))
        if (logDate > (resolvedAt)) continue
        await db.workLog.create({
          data: {
            complaintId: complaint.id,
            technicianId: technician.id,
            actionTaken: workActions[Math.floor(Math.random() * workActions.length)],
            cost: 10 + Math.floor(Math.random() * 491),
            spareParts: Math.random() > 0.6 ? 'Kabel HDMI, Thermal Paste, SSD 256GB' : null,
            loggedAt: logDate,
          },
        })
      }
    }
  }

  // ==================== Suggestions (10 records) ====================
  console.log('💡 Seeding suggestions...')
  const suggestionsData = [
    { subject: 'Tambah Bilangan Printer di Makmal', message: 'Cadangan agar ditambah printer di Makmal Komputer 2 kerana pelajar terpaksa menunggu lama.', category: 'Peningkatan' },
    { subject: 'Latihan Penggunaan Sistem eAduan', message: 'Sediakan sesi taklimat kepada semua staf tentang penggunaan sistem ini.', category: 'Peningkatan' },
    { subject: 'WiFi Perlu Ditingkatkan di Surau', message: 'Sambungan WiFi di surau sangat lemah. Susah untuk akses ketika rehat.', category: 'Aduan Perkhidmatan' },
    { subject: 'Sistem Backup Data Berkala', message: 'Mohon supaya backup data dilakukan secara berkala untuk mengelakkan kehilangan data.', category: 'Umum' },
    { subject: 'Penyeliaan Kabel Rangkaian', message: 'Kabel rangkaian di Blok B kelihatan berselerak. Cadangan dikemas dan dilabel.', category: 'Peningkatan' },
    { subject: 'Tukar Projektor Auditorium', message: 'Projektor auditorium sudah lama dan kabur. Cadangan ditukar baru.', category: 'Aduan Perkhidmatan' },
    { subject: 'Aplikasi Mobile untuk Sistem Aduan', message: 'Sediakan aplikasi mobile agar mudah untuk staf hantar aduan dari mana sahaja.', category: 'Peningkatan' },
    { subject: 'Notifikasi WhatsApp', message: 'Mohon notifikasi status tiket dihantar melalui WhatsApp juga, bukan hanya email.', category: 'Peningkatan' },
    { subject: 'SLA Tindak Balas', message: 'Mohon tetapkan SLA tindak balas dalam 24 jam untuk aduan kritikal.', category: 'Umum' },
    { subject: 'Penggunaan Open Source Software', message: 'Cadangan guna perisian open source untuk mengurangkan kos lesen.', category: 'Peningkatan' },
  ]
  for (let i = 0; i < suggestionsData.length; i++) {
    const s = suggestionsData[i]
    const submittedBy = reporters[Math.floor(Math.random() * reporters.length)]
    const submittedAt = new Date(now.getTime() - (i + 1) * 24 * 3600000 * 3)
    const isAnswered = i < 6
    await db.suggestion.create({
      data: {
        submittedById: submittedBy.id,
        subject: s.subject,
        message: s.message,
        category: s.category,
        status: isAnswered ? 'Dijawab' : (i < 8 ? 'Dalam Semakan' : 'Baru'),
        adminResponse: isAnswered ? 'Terima kasih atas cadangan. Pihak Unit ICT akan mengkaji dan tindakan akan diambil dalam tempoh yang sesuai.' : null,
        createdAt: submittedAt,
        respondedAt: isAnswered ? new Date(submittedAt.getTime() + 24 * 3600000) : null,
      },
    })
  }

  // ==================== Notifications ====================
  console.log('🔔 Seeding notifications...')
  for (const u of profiles) {
    await db.notification.create({
      data: {
        userId: u.id,
        title: 'Selamat Datang ke Sistem eAduan Kerosakan ICT',
        message: 'Sistem siap digunakan. Sila hubungi Unit ICT jika ada pertanyaan.',
        type: 'info',
        isRead: false,
      },
    })
  }

  // ==================== Audit Logs ====================
  console.log('📝 Seeding audit logs...')
  for (const u of profiles.slice(0, 8)) {
    await db.auditLog.create({
      data: {
        userId: u.id,
        action: 'LOGIN',
        entity: 'auth',
        details: 'Log masuk berjaya',
        ipAddress: '192.168.1.' + (Math.floor(Math.random() * 200) + 10),
        severity: 'info',
        createdAt: new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 3600000)),
      },
    })
  }
  await db.auditLog.create({
    data: {
      userId: null,
      action: 'LOGIN_FAILED',
      entity: 'auth',
      details: 'Percubaan log masuk gagal dari IP tidak dikenali',
      ipAddress: '203.45.67.89',
      severity: 'warning',
      createdAt: new Date(now.getTime() - 3600000),
    },
  })

  console.log('\n✅ Seed completed!')
  console.log(`   - Profiles: ${profiles.length}`)
  console.log(`   - Equipment Types: ${equipmentTypes.length}`)
  console.log(`   - Damage Categories: ${damageCategories.length}`)
  console.log(`   - Assets: ${assets.length}`)
  console.log(`   - Complaints: ${complaints.length}`)
  console.log(`   - Suggestions: ${suggestionsData.length}`)
  console.log('\n🔑 Demo credentials (all use password: Password@123):')
  console.log('   Admin:     admin@adtecpg.edu.my')
  console.log('   Technician: tech1@adtecpg.edu.my')
  console.log('   Reporter:  staff1@adtecpg.edu.my')
  console.log('   Management: mgmt@adtecpg.edu.my')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
