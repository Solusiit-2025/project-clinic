// State variables to add:
  const [banks, setBanks] = useState<any[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPostConfirmModal, setShowPostConfirmModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<CorporateInvoice | null>(null)
  
  const [paymentData, setPaymentData] = useState({
    method: 'bank_transfer',
    amount: 0,
    transactionRef: '',
    bankId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  })

// Fetch banks function
  const fetchBanks = useCallback(async () => {
    if (!activeClinicId) return
    try {
      const res = await api.get('/master/banks', { params: { clinicId: activeClinicId, isActive: true } })
      setBanks(res.data)
    } catch (e) {
      console.error(e)
    }
  }, [activeClinicId])

// Call fetchBanks in useEffect
  useEffect(() => {
    if (activeClinicId) {
      fetchData()
      fetchPartners()
      fetchBanks()
    }
  }, [fetchData, fetchPartners, fetchBanks, activeClinicId])

// Payment function
  const handleProcessPayment = async () => {
    if (!selectedInvoice) return
    if (paymentData.amount <= 0) {
      toast.error('Nominal bayar harus lebih dari 0')
      return
    }
    setCreating(true)
    try {
      await api.post('/finance/corporate-billing/pay', {
        corporateInvoiceId: selectedInvoice.id,
        ...paymentData
      })
      toast.success('Pembayaran Perusahaan berhasil dicatat')
      setShowPaymentModal(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memproses pembayaran')
    } finally {
      setCreating(false)
    }
  }

// Posting function
  const handlePostJournal = async () => {
    if (!selectedInvoice) return
    setCreating(true)
    try {
      await api.post('/finance/corporate-billing/post', {
        corporateInvoiceId: selectedInvoice.id
      })
      toast.success('Pembayaran Perusahaan berhasil diposting ke Jurnal')
      setShowPostConfirmModal(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal memposting ke jurnal')
    } finally {
      setCreating(false)
    }
  }
