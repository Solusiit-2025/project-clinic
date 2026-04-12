import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Memulai seeding data contoh...')

    // 1. Get the main clinic
    const clinic = await prisma.clinic.findFirst({ where: { isMain: true } })
    if (!clinic) {
      console.error('❌ Tidak ada klinik utama ditemukan. Jalankan restore script dahulu.')
      return
    }

    // 2. Create Departments (Poli)
    console.log('🏢 Menambahkan Departemen/Poli...')
    const depts = [
      { name: 'Poli Umum', description: 'Pelayanan kesehatan umum' },
      { name: 'Poli Gigi', description: 'Pelayanan kesehatan gigi' },
      { name: 'Laboratorium', description: 'Pemeriksaan penunjang medis' }
    ]

    const createdDepts = []
    for (const d of depts) {
      let dept = await prisma.department.findFirst({
        where: { name: d.name, clinicId: clinic.id }
      })
      
      if (!dept) {
        dept = await prisma.department.create({
          data: { ...d, clinicId: clinic.id, isActive: true }
        })
      }
      createdDepts.push(dept)
    }
    console.log(`✅ ${createdDepts.length} Departemen berhasil disiapkan.`)

    // 3. Create/Link Doctor
    console.log('👨‍⚕️ Menyiapkan Data Dokter...')
    const doctorUser = await prisma.user.findUnique({ where: { username: 'drfauzi' } })
    if (doctorUser) {
      let doctor = await prisma.doctor.findUnique({ where: { email: doctorUser.email || undefined } })
      
      if (!doctor) {
        doctor = await prisma.doctor.create({
          data: {
            userId: doctorUser.id,
            name: doctorUser.name,
            email: doctorUser.email,
            phone: doctorUser.phone || '000000000',
            licenseNumber: 'SIP/2026/001',
            specialization: 'Dokter Umum',
            departments: {
              connect: { id: createdDepts[0].id }
            },
            isActive: true
          }
        })
      }
      console.log(`✅ Dokter ${doctor.name} siap.`)
    }

    // 4. Create Sample Patients
    console.log('👥 Menambahkan Data Pasien...')
    const patients = [
      { name: 'Budi Santoso', gender: 'M', bloodType: 'O', phone: '08123456789', address: 'Jl. Melati No. 12', dateOfBirth: new Date('1990-05-15') },
      { name: 'Siti Aminah', gender: 'F', bloodType: 'A', phone: '08987654321', address: 'Jl. Mawar No. 45', dateOfBirth: new Date('1985-11-20') }
    ]

    for (const p of patients) {
      const existing = await prisma.patient.findFirst({ where: { name: p.name, phone: p.phone } })
      if (!existing) {
        const patient = await prisma.patient.create({
          data: {
            ...p,
            medicalRecordNo: `RM-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          }
        })
        console.log(`✅ Pasien ${patient.name} dibuat (RM: ${patient.medicalRecordNo})`)
      }
    }

    console.log('\n✨ Seeding Selesai! Anda sekarang dapat melakukan simulasi pendaftaran dan pemeriksaan.')

  } catch (error) {
    console.error('❌ Seed gagal:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
