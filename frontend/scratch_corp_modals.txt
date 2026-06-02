{/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-900 uppercase">Proses Pembayaran</h3>
                <button onClick={() => setShowPaymentModal(false)} className="w-8 h-8 flex items-center justify-center bg-white text-gray-400 hover:text-gray-900 rounded-full shadow-sm hover:shadow-md transition-all">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Sisa Tagihan</span>
                  <span className="text-lg font-black text-blue-700">{formatCurrency(selectedInvoice.total - selectedInvoice.amountPaid)}</span>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Metode Pembayaran</label>
                  <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none">
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="cash">Tunai (Cash)</option>
                  </select>
                </div>
                {paymentData.method === 'bank_transfer' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pilih Bank Penerima</label>
                    <select value={paymentData.bankId} onChange={e => setPaymentData({...paymentData, bankId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none">
                      <option value="">-- Pilih Bank --</option>
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} (A/n {b.accountName})</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nominal Dibayar (Rp)</label>
                  <input type="number" value={paymentData.amount || ''} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" placeholder="0" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tanggal Bayar</label>
                    <input type="date" value={paymentData.paymentDate} onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">No Referensi / Bukti</label>
                    <input type="text" value={paymentData.transactionRef} onChange={e => setPaymentData({...paymentData, transactionRef: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" placeholder="TRX-123" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Catatan</label>
                  <input type="text" value={paymentData.notes} onChange={e => setPaymentData({...paymentData, notes: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Batal</button>
                <button onClick={handleProcessPayment} disabled={creating} className="flex-1 py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                  {creating ? 'Memproses...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Post Confirm Modal */}
        {showPostConfirmModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Posting ke Jurnal?</h3>
              <p className="text-xs font-bold text-gray-500 mb-8">
                Tindakan ini akan membuat jurnal transaksi otomatis ke Buku Besar (Kas/Bank bertambah, Piutang berkurang) sebesar <span className="text-emerald-600 font-black">{formatCurrency(selectedInvoice.amountPaid)}</span>. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowPostConfirmModal(false)} className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Batal</button>
                <button onClick={handlePostJournal} disabled={creating} className="flex-1 py-3 px-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                  {creating ? 'Memproses...' : 'Ya, Posting'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
