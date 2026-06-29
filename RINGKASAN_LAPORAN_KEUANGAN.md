# Ringkasan Modul & Alur Laporan Keuangan Aplikasi Klinik

Dokumen ini merangkum struktur data (model) dan alur (flow) modul keuangan dan akuntansi pada aplikasi klinik.

## 1. Entitas & Model Keuangan Utama
Aplikasi ini memiliki sistem keuangan dan akuntansi (double-entry) yang cukup komprehensif, ditandai dengan adanya tabel-tabel berikut:

### A. Pendapatan & Tagihan (Revenue)
*   **`Invoice` & `InvoiceItem`**: Menyimpan data tagihan kepada pasien untuk layanan medis, obat, atau tindakan lainnya.
*   **`Payment`**: Menyimpan catatan pembayaran atas `Invoice`.
*   **`CorporateInvoice` & `CorporatePayment`**: Tagihan dan pembayaran yang ditujukan untuk mitra perusahaan (Corporate/Asuransi/BPJS).

### B. Pengeluaran (Expense)
*   **`Expense` & `ExpenseCategory`**: Mencatat pengeluaran operasional klinik (listrik, gaji staf non-medis, alat tulis, dll) yang dikelompokkan berdasarkan kategorinya.
*   **`ProcurementPayment`**: Mencatat pembayaran kepada supplier atas pengadaan barang/obat (`Procurement`).
*   **`DoctorCommission`**: Mencatat bagi hasil atau komisi yang diberikan kepada dokter atas jasa layanan yang mereka berikan ke pasien.

### C. Akuntansi & Pembukuan (Accounting)
*   **`ChartOfAccount` (COA)**: Daftar akun standar (Bagan Akun) yang digunakan dalam penjurnalan (Kas, Bank, Piutang, Pendapatan, Beban, dll).
*   **`JournalEntry` & `JournalDetail`**: Jurnal umum yang mencatat setiap mutasi transaksi dengan sistem *double-entry* (Debit & Kredit).
*   **`OpeningBalance` & `OpeningBalanceItem`**: Mencatat saldo awal pembukuan untuk tiap akun/COA di periode baru.
*   **`Bank` & `CashTransfer`**: Mencatat rekening bank klinik dan pergerakan/transfer uang kas antar akun (misal: Kasir ke Bank).
*   **`SystemAccount`**: Konfigurasi pemetaan akun otomatis (misal: menentukan COA mana yang dipakai untuk Pendapatan Obat, atau Beban Gaji).

### D. Rekapitulasi & Pelaporan
*   **`FinancialReport`**: Tabel ini berfungsi untuk menyimpan *snapshot* atau *summary* laporan keuangan yang telah digenerate pada periode tertentu (misal: harian atau bulanan). 
    *   Kolom yang disimpan: `reportDate`, `reportType`, `totalRevenue`, `totalExpense`, `totalProfit`, `totalPatients`, `totalAppointments`.

---

## 2. Alur Transaksi Keuangan (Financial Flow)

1.  **Siklus Pendapatan (Pasien ke Klinik):**
    *   Pasien mendaftar, menerima layanan medis, dan diresepkan obat.
    *   Sistem men-generate `Invoice` yang berisi detail biaya layanan dan obat (`InvoiceItem`).
    *   Pasien (atau Mitra/Asuransi) melakukan pembayaran yang dicatat dalam `Payment` (atau `CorporatePayment`).
    *   *Sistem secara otomatis (atau manual)* membuat `JournalEntry` (Debit: Kas/Bank, Kredit: Pendapatan Layanan/Obat) berdasarkan mapping di `SystemAccount`.

2.  **Siklus Pengadaan Obat/Alat Kesehatan:**
    *   Klinik membuat pesanan ke supplier (`Procurement`).
    *   Pembayaran ke supplier dicatat melalui `ProcurementPayment`.
    *   Transaksi ini masuk ke jurnal (Debit: Persediaan Obat/Hutang, Kredit: Kas/Bank).

3.  **Siklus Pengeluaran Operasional & Komisi:**
    *   Pengeluaran rutin dicatat melalui `Expense` (Debit: Beban X, Kredit: Kas).
    *   Sistem menghitung tagihan dokter, lalu dibayarkan melalui `DoctorCommission` (Debit: Beban Komisi, Kredit: Kas).

4.  **Siklus Pelaporan Akhir:**
    *   Berdasarkan semua mutasi di `JournalEntry` dan `JournalDetail`, sistem dapat men-generate laporan:
        *   **Buku Besar (Ledger)**
        *   **Neraca (Balance Sheet)**
        *   **Laba / Rugi (Profit & Loss)**
    *   Selain itu, untuk keperluan *dashboarding* dan rekap cepat, sistem secara berkala / atas permintaan user akan mengumpulkan agregat `totalRevenue`, `totalExpense`, dan menghitung `totalProfit`, lalu menyimpannya dalam tabel `FinancialReport`.
