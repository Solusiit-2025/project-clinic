import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { getPaginationOptions, PaginatedResult } from '../utils/pagination'
import { parseLocalDate } from '../utils/date'

/**
 * Get Doctor Commission / Fee Report
 * Unified report from automated invoice splitting and manual entries
 */
export const getDoctorFeeReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, doctorId, clinicId, page: pageParam, status } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const { skip, take, page, limit } = getPaginationOptions(req.query)

    const dateWhere: any = {}
    if (startDate) {
      dateWhere.gte = parseLocalDate(String(startDate))
    }
    if (endDate) {
      dateWhere.lte = parseLocalDate(String(endDate), true)
    }

    const where: any = {
      ...(doctorId ? { doctorId: String(doctorId) } : {}),
      ...(status ? { status: String(status) } : {}),
      ...(clinicId ? { clinicId: String(clinicId) } : (!isAdminView ? { clinicId: currentClinicId } : {})),
      ...(Object.keys(dateWhere).length > 0 ? { date: dateWhere } : {})
    }

    const [total, results] = await Promise.all([
      (prisma as any).doctorCommission.count({ where }),
      (prisma as any).doctorCommission.findMany({
        where,
        include: {
          doctor: { select: { name: true } },
          invoice: { 
            include: { 
              patient: { select: { name: true, medicalRecordNo: true } }
            } 
          }
        },
        orderBy: { date: 'desc' },
        skip: pageParam ? skip : undefined,
        take: pageParam ? take : undefined,
      })
    ])

    const reportData = results.map((item: any) => ({
      id: item.id,
      date: item.date,
      invoiceNo: item.invoice?.invoiceNo || 'MANUAL',
      invoiceDate: item.invoice?.invoiceDate,
      patientName: item.invoice?.patient?.name || 'N/A',
      patientMRN: item.invoice?.patient?.medicalRecordNo || 'N/A',
      doctorName: item.doctor.name,
      serviceName: item.description,
      totalPrice: item.type === 'INVOICE' ? (item.amount > 0 ? 'See Invoice' : 0) : '-', 
      doctorFee: item.amount,
      type: item.type,
      status: item.status,
      paidAt: item.paidAt
    }))

    if (pageParam) {
      const result: PaginatedResult<any> = {
        data: reportData,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      }
      return res.json(result)
    }

    res.json(reportData)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Create Manual Commission (e.g. Uang Duduk)
 * Also creates a Journal Entry
 */
export const createManualCommission = async (req: Request, res: Response) => {
  try {
    const { doctorId, amount, description, date } = req.body
    const clinicId = (req as any).clinicId

    if (!doctorId || !amount) {
      return res.status(400).json({ message: 'Dokter dan Nominal wajib diisi' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Commission Record
      const commission = await (tx as any).doctorCommission.create({
        data: {
          doctorId,
          clinicId,
          amount: parseFloat(amount),
          description,
          date: date ? parseLocalDate(String(date)) : new Date(),
          type: 'MANUAL',
          status: 'unpaid'
        },
        include: { doctor: true }
      })

      // 2. Create Journal Entry (Manual Adjustment)
      const sysAccountKeys = ['DOCTOR_FEE_PAYABLE', 'DOCTOR_FEE_EXPENSE']
      const sysAccounts = await tx.systemAccount.findMany({
        where: { key: { in: sysAccountKeys }, OR: [{ clinicId }, { clinicId: null }] },
        include: { coa: true }
      })

      const getSysAcc = (key: string) => sysAccounts.find(a => a.key === key)
      
      const payableAcc = getSysAcc('DOCTOR_FEE_PAYABLE')?.coa || await tx.chartOfAccount.findFirst({ where: { code: '2-1102' } })
      const expenseAcc = getSysAcc('DOCTOR_FEE_EXPENSE')?.coa || await tx.chartOfAccount.findFirst({ where: { code: '6-1102' } })

      if (!payableAcc || !expenseAcc) {
        throw new Error('Konfigurasi Akun Sistem (Hutang/Beban Jasa Medik) belum lengkap.')
      }

      await tx.journalEntry.create({
        data: {
          date: commission.date,
          description: `Penyesuaian Jasa Medik Manual: ${description} - ${commission.doctor.name}`,
          referenceNo: `ADJ-${commission.id.slice(0,8).toUpperCase()}`,
          entryType: 'SYSTEM',
          clinicId,
          details: {
            create: [
              { coaId: expenseAcc.id, debit: commission.amount, credit: 0, description: `Beban Jasa Manual: ${description}` },
              { coaId: payableAcc.id, debit: 0, credit: commission.amount, description: `Hutang Jasa Manual: ${commission.doctor.name}` }
            ]
          }
        }
      })

      return commission
    })

    res.status(201).json(result)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Pay Commissions (Settlement)
 * Mark as paid and create Journal Entry
 */
export const payCommissions = async (req: Request, res: Response) => {
  try {
    const { commissionIds, coaId, date, notes } = req.body
    const clinicId = (req as any).clinicId

    if (!commissionIds || !commissionIds.length || !coaId) {
      return res.status(400).json({ message: 'Data komisi dan Akun Pembayaran wajib diisi' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Commissions
      const commissions = await (tx as any).doctorCommission.findMany({
        where: { id: { in: commissionIds }, status: 'unpaid' },
        include: { doctor: true }
      })

      if (commissions.length === 0) throw new Error('Tidak ada komisi yang valid untuk dibayar.')

      const totalAmount = commissions.reduce((sum: number, c: any) => sum + c.amount, 0)
      const doctorName = commissions[0].doctor.name
      const displayDesc = commissions.length === 1 ? commissions[0].description : `${commissions.length} Layanan`

      // 2. Mark as Paid
      await (tx as any).doctorCommission.updateMany({
        where: { id: { in: commissionIds } },
        data: { status: 'paid', paidAt: date ? parseLocalDate(String(date)) : new Date() }
      })

      // 3. Create Journal Entry
      const payableSys = await tx.systemAccount.findFirst({
        where: { key: 'DOCTOR_FEE_PAYABLE', OR: [{ clinicId }, { clinicId: null }] },
        include: { coa: true }
      })
      const payableAcc = payableSys?.coa || await tx.chartOfAccount.findFirst({ where: { code: '2-1102' } })
      
      if (!payableAcc) throw new Error('Akun Hutang Jasa Medik tidak ditemukan.')

      await tx.journalEntry.create({
        data: {
          date: date ? parseLocalDate(String(date)) : new Date(),
          description: `Pembayaran Jasa Medik: ${doctorName} (${displayDesc})`,
          referenceNo: `PAY-${Date.now().toString().slice(-6)}`,
          entryType: 'SYSTEM',
          clinicId,
          details: {
            create: [
              { coaId: payableAcc.id, debit: totalAmount, credit: 0, description: `Pelunasan Jasa Medik: ${doctorName}` },
              { coaId: coaId, debit: 0, credit: totalAmount, description: `Pembayaran via Kas/Bank - ${notes || ''}` }
            ]
          }
        }
      })

      return { totalAmount, count: commissions.length }
    })

    res.json({ message: 'Pembayaran jasa medik berhasil diproses', data: result })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Update Doctor Commission / Fee
 */
export const updateDoctorCommission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { doctorId, amount, description, date } = req.body
    const clinicId = (req as any).clinicId

    const commission = await (prisma as any).doctorCommission.findUnique({
      where: { id },
      include: { doctor: true }
    })

    if (!commission) {
      return res.status(404).json({ message: 'Komisi dokter tidak ditemukan' })
    }

    if (commission.status === 'paid') {
      return res.status(400).json({ message: 'Komisi yang sudah dibayar tidak dapat diubah' })
    }

    const updatedAmount = amount !== undefined ? parseFloat(amount) : commission.amount
    const updatedDesc = description !== undefined ? description : commission.description
    const updatedDate = date ? parseLocalDate(String(date)) : commission.date
    const updatedDoctorId = doctorId || commission.doctorId

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Commission Record
      const updated = await (tx as any).doctorCommission.update({
        where: { id },
        data: {
          doctorId: updatedDoctorId,
          amount: updatedAmount,
          description: updatedDesc,
          date: updatedDate
        },
        include: { doctor: true }
      })

      // 2. If MANUAL, also update the Journal Entry
      if (commission.type === 'MANUAL') {
        const refNo = `ADJ-${commission.id.slice(0, 8).toUpperCase()}`
        const journal = await tx.journalEntry.findFirst({
          where: { referenceNo: refNo, clinicId }
        })

        if (journal) {
          const sysAccountKeys = ['DOCTOR_FEE_PAYABLE', 'DOCTOR_FEE_EXPENSE']
          const sysAccounts = await tx.systemAccount.findMany({
            where: { key: { in: sysAccountKeys }, OR: [{ clinicId }, { clinicId: null }] },
            include: { coa: true }
          })

          const getSysAcc = (key: string) => sysAccounts.find(a => a.key === key)
          const payableAcc = getSysAcc('DOCTOR_FEE_PAYABLE')?.coa || await tx.chartOfAccount.findFirst({ where: { code: '2-1102' } })
          const expenseAcc = getSysAcc('DOCTOR_FEE_EXPENSE')?.coa || await tx.chartOfAccount.findFirst({ where: { code: '6-1102' } })

          if (payableAcc && expenseAcc) {
            await tx.journalDetail.deleteMany({
              where: { journalEntryId: journal.id }
            })

            await tx.journalEntry.update({
              where: { id: journal.id },
              data: {
                date: updatedDate,
                description: `Penyesuaian Jasa Medik Manual: ${updatedDesc} - ${updated.doctor.name}`,
                details: {
                  create: [
                    { coaId: expenseAcc.id, debit: updatedAmount, credit: 0, description: `Beban Jasa Manual: ${updatedDesc}` },
                    { coaId: payableAcc.id, debit: 0, credit: updatedAmount, description: `Hutang Jasa Manual: ${updated.doctor.name}` }
                  ]
                }
              }
            })
          }
        }
      }

      return updated
    })

    res.json({ message: 'Komisi dokter berhasil diperbarui', data: result })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Delete Doctor Commission / Fee
 */
export const deleteDoctorCommission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const clinicId = (req as any).clinicId

    const commission = await (prisma as any).doctorCommission.findUnique({
      where: { id }
    })

    if (!commission) {
      return res.status(404).json({ message: 'Komisi dokter tidak ditemukan' })
    }

    if (commission.status === 'paid') {
      return res.status(400).json({ message: 'Komisi yang sudah dibayar tidak dapat dihapus' })
    }

    await prisma.$transaction(async (tx) => {
      // 1. If MANUAL, also delete the Journal Entry
      if (commission.type === 'MANUAL') {
        const refNo = `ADJ-${commission.id.slice(0, 8).toUpperCase()}`
        const journal = await tx.journalEntry.findFirst({
          where: { referenceNo: refNo, clinicId }
        })

        if (journal) {
          await tx.journalDetail.deleteMany({
            where: { journalEntryId: journal.id }
          })
          await tx.journalEntry.delete({
            where: { id: journal.id }
          })
        }
      }

      // 2. Delete the commission
      await (tx as any).doctorCommission.delete({
        where: { id }
      })
    })

    res.json({ message: 'Komisi dokter berhasil dihapus' })
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Get Patient Diagnosis Report
 */
export const getDiagnosisReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, clinicId, page: pageParam, search } = req.query
    const currentClinicId = (req as any).clinicId
    const isAdminView = (req as any).isAdminView

    const { skip, take, page, limit } = getPaginationOptions(req.query)

    const dateWhere: any = {}
    if (startDate) {
      dateWhere.gte = parseLocalDate(String(startDate))
    }
    if (endDate) {
      dateWhere.lte = parseLocalDate(String(endDate), true)
    }

    const finalClinicId = isAdminView 
      ? (clinicId ? String(clinicId) : undefined)
      : (currentClinicId || (clinicId ? String(clinicId) : undefined))

    const where: any = {
      ...(finalClinicId ? { clinicId: finalClinicId } : {}),
      ...(Object.keys(dateWhere).length > 0 ? { recordDate: dateWhere } : {}),
      OR: [
        { diagnosis: { not: null } },
        { icd10Id: { not: null } }
      ],
      ...(search ? {
        OR: [
          { patient: { name: { contains: String(search), mode: 'insensitive' } } },
          { patient: { medicalRecordNo: { contains: String(search), mode: 'insensitive' } } },
          { diagnosis: { contains: String(search), mode: 'insensitive' } },
          { icd10: { code: { contains: String(search), mode: 'insensitive' } } },
          { icd10: { nameId: { contains: String(search), mode: 'insensitive' } } }
        ]
      } : {})
    }

    const [total, results] = await Promise.all([
      prisma.medicalRecord.count({ where }),
      prisma.medicalRecord.findMany({
        where,
        include: {
          patient: { select: { name: true, medicalRecordNo: true, gender: true, dateOfBirth: true } },
          doctor: { select: { name: true } },
          icd10: { select: { code: true, nameId: true } }
        },
        orderBy: { recordDate: 'desc' },
        skip: pageParam ? skip : undefined,
        take: pageParam ? take : undefined,
      })
    ])

    const reportData = results.map((item: any) => ({
      id: item.id,
      recordNo: item.recordNo,
      recordDate: item.recordDate,
      patientName: item.patient?.name || 'N/A',
      patientMRN: item.patient?.medicalRecordNo || 'N/A',
      patientGender: item.patient?.gender || '-',
      patientAge: item.patient?.dateOfBirth 
        ? Math.floor((new Date().getTime() - new Date(item.patient.dateOfBirth).getTime()) / 31557600000) 
        : null,
      doctorName: item.doctor?.name || '-',
      diagnosis: item.diagnosis || '-',
      icd10Code: item.icd10?.code || null,
      icd10Name: item.icd10?.nameId || null
    }))

    if (pageParam) {
      const result: PaginatedResult<any> = {
        data: reportData,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      }
      return res.json(result)
    }

    res.json(reportData)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}

/**
 * Get Laporan Bulanan Klinik (LBK)
 */
export const getLbkReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, clinicId } = req.query;
    const currentClinicId = (req as any).clinicId;
    const isAdminView = (req as any).isAdminView;

    const dateWhere: any = {};
    if (startDate) {
      dateWhere.gte = parseLocalDate(String(startDate));
    }
    if (endDate) {
      dateWhere.lte = parseLocalDate(String(endDate), true);
    }

    const finalClinicId = isAdminView 
      ? (clinicId ? String(clinicId) : undefined)
      : (currentClinicId || (clinicId ? String(clinicId) : undefined));

    const where: any = {
      ...(finalClinicId ? { clinicId: finalClinicId } : {}),
      ...(Object.keys(dateWhere).length > 0 ? { recordDate: dateWhere } : {}),
      icd10Id: { not: null }
    };

    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        patient: { select: { id: true, gender: true, dateOfBirth: true } },
        icd10: { select: { id: true, code: true, nameId: true, nameEn: true } }
      }
    });

    const referralsCount = await prisma.referral.count({
      where: {
        medicalRecord: {
          ...(finalClinicId ? { clinicId: finalClinicId } : {}),
          ...(Object.keys(dateWhere).length > 0 ? { recordDate: dateWhere } : {})
        }
      }
    });

    const births = await prisma.birthRecord.findMany({
      where: {
        ...(Object.keys(dateWhere).length > 0 ? { birthDate: dateWhere } : {})
      },
      include: {
        patient: { select: { name: true, address: true } }
      }
    });

    const deaths = await prisma.patient.findMany({
      where: {
        isDeceased: true,
        ...(Object.keys(dateWhere).length > 0 ? { dateOfDeath: dateWhere } : {})
      },
      include: {
        deathIcd10: { select: { code: true, nameId: true, nameEn: true } }
      }
    });

    const registrations = await prisma.registration.findMany({
      where: {
        ...(finalClinicId ? { clinicId: finalClinicId } : {}),
        ...(Object.keys(dateWhere).length > 0 ? { registrationDate: dateWhere } : {})
      },
      include: { patient: { select: { createdAt: true } } }
    });

    const totalVisits = registrations.length;
    // Anggap kunjungan baru jika pasien dibuat pada bulan yang sama dengan pendaftaran
    // Cara ideal: cek apakah ini registrasi pertama pasien tersebut.
    // Sebagai aproksimasi cepat, kita cek rentang waktunya.
    const newVisits = registrations.filter(r => {
      if (startDate) {
        return new Date(r.patient.createdAt) >= parseLocalDate(String(startDate));
      }
      return false; // Jika tidak ada startDate, kita anggap semua lama
    }).length;
    const oldVisits = totalVisits - newVisits;

    // Hitung Umur dalam hari/bulan/tahun
    const getAgeGroup = (dob: Date | null | undefined, recordDate: Date) => {
      if (!dob) return 'unknown';
      const diffTime = Math.abs(recordDate.getTime() - new Date(dob).getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) return '0-7h';
      if (diffDays <= 28) return '8-28h';
      if (diffDays <= 335) return '1-11b'; // approx 11 months
      
      const ageYrs = Math.floor(diffDays / 365.25);
      if (ageYrs >= 1 && ageYrs <= 4) return '1-4t';
      if (ageYrs >= 5 && ageYrs <= 9) return '5-9t';
      if (ageYrs >= 10 && ageYrs <= 14) return '10-14t';
      if (ageYrs >= 15 && ageYrs <= 19) return '15-19t';
      if (ageYrs >= 20 && ageYrs <= 44) return '20-44t';
      if (ageYrs >= 45 && ageYrs <= 59) return '45-59t';
      if (ageYrs > 59) return '>59t';
      return 'unknown';
    };

    // Cari kasus lama vs baru per penyakit per pasien
    // Untuk ini, ambil record pertama pasien untuk tiap icd10 sebelum endDate
    const patientIcdKeys = Array.from(new Set(records.map(r => `${r.patientId}_${r.icd10Id}`)));
    
    // Karena kita tidak ingin loop satu-satu (lama), kita group by patientId & icd10Id
    const firstRecords = await prisma.medicalRecord.groupBy({
      by: ['patientId', 'icd10Id'],
      where: {
        icd10Id: { not: null },
        ...(finalClinicId ? { clinicId: finalClinicId } : {}),
        ...(dateWhere.lte ? { recordDate: { lte: dateWhere.lte } } : {})
      },
      _min: {
        recordDate: true
      }
    });

    const firstRecordMap = new Map();
    firstRecords.forEach(r => {
      firstRecordMap.set(`${r.patientId}_${r.icd10Id}`, r._min.recordDate);
    });

    const morbidityMap = new Map<string, any>();

    records.forEach(r => {
      const icdCode = r.icd10?.code || 'Unknown';
      const icdName = r.icd10?.nameId || r.icd10?.nameEn || 'Unknown';
      const gender = (r.patient?.gender === 'L' || r.patient?.gender === 'Laki-laki') ? 'L' : 'P';
      const ageGroup = getAgeGroup(r.patient?.dateOfBirth, r.recordDate);
      
      const pKey = `${r.patientId}_${r.icd10Id}`;
      const firstDate = firstRecordMap.get(pKey);
      
      // Jika firstDate ada di range ini (>= startDate), maka Kasus Baru.
      // Jika firstDate < startDate, maka Kasus Lama.
      let isBaru = true;
      if (firstDate && startDate) {
        if (new Date(firstDate) < parseLocalDate(String(startDate))) {
          isBaru = false;
        }
      } else if (firstDate && !startDate) {
        isBaru = false; // Jika ga ada start date, semua dari awal dianggap lama kecuali dirinya sendiri (agak bias, kita anggap baru)
      }

      if (!morbidityMap.has(icdCode)) {
        morbidityMap.set(icdCode, {
          icdCode,
          icdName,
          kasusBaru: 0,
          kasusLama: 0,
          demografi: {
            '0-7h': { L: 0, P: 0 }, '8-28h': { L: 0, P: 0 }, '1-11b': { L: 0, P: 0 },
            '1-4t': { L: 0, P: 0 }, '5-9t': { L: 0, P: 0 }, '10-14t': { L: 0, P: 0 },
            '15-19t': { L: 0, P: 0 }, '20-44t': { L: 0, P: 0 }, '45-59t': { L: 0, P: 0 },
            '>59t': { L: 0, P: 0 }, 'unknown': { L: 0, P: 0 }
          }
        });
      }

      const item = morbidityMap.get(icdCode);
      if (isBaru) item.kasusBaru++; else item.kasusLama++;
      if (item.demografi[ageGroup]) {
        item.demografi[ageGroup][gender]++;
      }
    });

    const morbidityList = Array.from(morbidityMap.values());
    const topDiseases = [...morbidityList].sort((a, b) => (b.kasusBaru + b.kasusLama) - (a.kasusBaru + a.kasusLama)).slice(0, 10);

    res.json({
      visits: {
        total: totalVisits,
        baru: newVisits,
        lama: oldVisits,
        rujukan: referralsCount
      },
      morbidity: morbidityList,
      topDiseases,
      births,
      deaths
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
}
