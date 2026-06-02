/**
 * Post a corporate invoice payment to General Ledger
 */
export const postCorporateInvoice = async (req: Request, res: Response) => {
  try {
    const { corporateInvoiceId } = req.body
    const currentClinicId = (req as any).clinicId

    if (!corporateInvoiceId) {
      return res.status(400).json({ message: 'ID Invoice Perusahaan diperlukan' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Corporate Invoice
      const cInv = await tx.corporateInvoice.findUnique({
        where: { id: corporateInvoiceId },
        include: {
          payments: {
            include: { bank: true }
          },
          corporatePartner: true
        }
      })

      if (!cInv) throw new Error('Corporate Invoice tidak ditemukan')
      if (cInv.isPosted) throw new Error('Invoice ini sudah diposting ke Jurnal')
      if (cInv.amountPaid <= 0) throw new Error('Belum ada pembayaran yang masuk untuk diposting')

      const targetClinicId = cInv.clinicId || currentClinicId

      // 2. Resolve System Accounts
      const sysAccountKeys = ['CASH_ACCOUNT', 'BANK_ACCOUNT', 'ACCOUNTS_RECEIVABLE']
      const sysAccounts = await tx.systemAccount.findMany({
        where: { key: { in: sysAccountKeys }, OR: [{ clinicId: targetClinicId }, { clinicId: null }] },
        include: { coa: true },
        orderBy: { clinicId: 'desc' }
      })

      const resolveSpecificCoa = async (coa: any, clinicId: string) => {
        if (!coa || !clinicId) return coa
        const clinic = await tx.clinic.findUnique({ where: { id: clinicId }, select: { code: true } })
        if (!clinic?.code) return coa

        const baseCode = coa.code.split('-').length > 2
          ? coa.code.split('-').slice(0, 2).join('-')
          : coa.code

        const specificCode = `${baseCode}-${clinic.code}`
        const specificCoa = await tx.chartOfAccount.findFirst({
          where: { code: specificCode, OR: [{ clinicId }, { clinicId: null }] }
        })
        return specificCoa || coa
      }

      const getSysAcc = async (key: string) => {
        const sys = sysAccounts.find(s => s.key === key)
        if (!sys?.coa) return null
        return await resolveSpecificCoa(sys.coa, targetClinicId)
      }

      const getCoaByCode = async (code: string) => {
        const coa = await tx.chartOfAccount.findFirst({
          where: { code, OR: [{ clinicId: targetClinicId }, { clinicId: null }] }
        })
        return await resolveSpecificCoa(coa, targetClinicId)
      }

      // 3. Define AR Account (Credit)
      const arAccount = await getSysAcc('ACCOUNTS_RECEIVABLE') || await getCoaByCode('1-1201')
      if (!arAccount) throw new Error('Akun Piutang (ACCOUNTS_RECEIVABLE) tidak tersedia.')

      // 4. Generate Journals per Payment
      const journals = []
      for (const payment of cInv.payments) {
        // Define Bank/Cash Account (Debit)
        let bankAccount = null
        if (payment.bankId) {
          const bankData = await tx.bank.findUnique({ where: { id: payment.bankId }, include: { coa: true } })
          if (bankData?.coaId) bankAccount = await resolveSpecificCoa(bankData.coa, targetClinicId)
        }
        if (!bankAccount) {
          bankAccount = payment.paymentMethod === 'cash'
            ? await getSysAcc('CASH_ACCOUNT') || await getCoaByCode('1-1101')
            : await getSysAcc('BANK_ACCOUNT') || await getCoaByCode('1-1102')
        }
        if (!bankAccount) throw new Error(`Akun Kas/Bank tidak tersedia untuk metode ${payment.paymentMethod}.`)

        const journal = await tx.journalEntry.create({
          data: {
            date: payment.paymentDate,
            description: `Pelunasan Piutang B2B - Inv #${cInv.invoiceNo}`,
            referenceNo: payment.paymentNo,
            entryType: 'SYSTEM',
            clinicId: targetClinicId,
            details: {
              create: [
                { accountId: bankAccount.id, debit: payment.amount, credit: 0 },
                { accountId: arAccount.id, debit: 0, credit: payment.amount }
              ]
            }
          }
        })
        journals.push(journal)
      }

      // 5. Update Corporate Invoice
      const updatedCInv = await tx.corporateInvoice.update({
        where: { id: corporateInvoiceId },
        data: {
          isPosted: true,
          postedAt: new Date()
        }
      })

      return { updatedCInv, journals }
    })

    res.status(201).json({ message: 'Posting pelunasan Corporate B2B berhasil', data: result })
  } catch (e: any) {
    res.status(400).json({ message: e.message })
  }
}
