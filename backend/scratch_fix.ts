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
                { coaId: bankAccount.id, debit: payment.amount, credit: 0 },
                { coaId: arAccount.id, debit: 0, credit: payment.amount }
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
