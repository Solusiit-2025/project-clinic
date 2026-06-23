# PRD: Fitur Rangkaian Perawatan (Treatment Series)

| | |
|---|---|
| **Versi dokumen** | 1.0 |
| **Tanggal** | 17 Juni 2026 |
| **Status** | Draft |
| **Modul terkait** | Manajemen Rekam Medis & Perawatan Pasien |

---

## 1. Latar belakang & masalah

Saat ini, fitur "Buat Rangkaian Perawatan" hanya menyediakan satu field input, yaitu deskripsi/nama rangkaian (contoh: "Perawatan Saluran Akar Gigi 36"). Setelah disimpan, rangkaian ini tidak memiliki struktur lanjutan untuk mencatat:

- Daftar tindakan/prosedur yang termasuk dalam rangkaian tersebut
- Tahapan dan urutan kunjungan
- Jadwal tanggal per tahap
- Estimasi dan rincian harga per tindakan
- Status kemajuan setiap tahap

Akibatnya, dokter dan admin tidak memiliki cara terstruktur untuk melacak progres perawatan multi-kunjungan (misalnya perawatan saluran akar yang umumnya membutuhkan 2-4 kali kunjungan), pasien tidak mendapat estimasi biaya total di awal, dan tim front office kesulitan melakukan billing serta penjadwalan ulang.

## 2. Tujuan

1. Memungkinkan dokter menyusun rencana perawatan multi-tahap secara terstruktur dalam satu rangkaian.
2. Menyediakan estimasi total biaya perawatan kepada pasien sejak rangkaian dibuat.
3. Memberikan visibilitas status progres setiap tahap kepada dokter, perawat, dan admin.
4. Mempermudah admin dalam penjadwalan kunjungan lanjutan dan proses billing per tahap.

## 3. Lingkup (scope)

### Termasuk dalam scope
- Form pembuatan rangkaian perawatan (sudah ada, akan diperluas)
- Halaman detail rangkaian: daftar tahapan, tindakan, jadwal, status, dan harga
- Pengambilan harga otomatis dari master data tarif tindakan
- Pencatatan status per tahap (belum, berjalan, selesai)
- Ringkasan total biaya rangkaian

### Tidak termasuk dalam scope (fase ini)
- Integrasi pembayaran/payment gateway
- Notifikasi otomatis ke pasien (WhatsApp/SMS/email) terkait jadwal
- Approval/persetujuan biaya oleh asuransi atau pihak ketiga
- Cetak dokumen informed consent otomatis

## 4. Target pengguna & hak akses

| Peran | Tanggung jawab utama | Akses pada fitur ini |
|---|---|---|
| Dokter | Menentukan tindakan, jumlah tahap, dan urutan klinis | Buat & edit rangkaian, isi/ubah daftar tindakan dan tahapan, ubah status tahap |
| Perawat/Asisten | Membantu input data sesuai instruksi dokter, mencatat hasil tindakan | Lihat rangkaian, input hasil tindakan per tahap, ubah status tahap (jika diberi izin) |
| Admin/Front office | Mengatur jadwal kunjungan dan proses billing | Lihat rangkaian, isi/ubah tanggal jadwal kunjungan, lihat dan proses estimasi biaya |
| Pasien (read-only, jika ada portal) | Memantau rencana perawatannya | Lihat ringkasan tahapan, jadwal, dan estimasi biaya (tanpa edit) |

Catatan: pembagian akses di atas adalah rekomendasi umum dan perlu disesuaikan dengan modul role & permission yang sudah ada di sistem.

## 5. User stories

- Sebagai **dokter**, saya ingin membuat rangkaian perawatan dan langsung menambahkan daftar tindakan beserta urutan tahapnya, agar rencana perawatan pasien tercatat lengkap sejak awal.
- Sebagai **dokter**, saya ingin memilih tindakan dari master data, agar harga otomatis terisi tanpa saya input manual.
- Sebagai **admin**, saya ingin mengisi atau mengubah tanggal kunjungan untuk setiap tahap, agar jadwal pasien sesuai dengan ketersediaan dokter.
- Sebagai **admin**, saya ingin melihat total estimasi biaya rangkaian, agar saya bisa menyampaikan informasi biaya ke pasien sebelum perawatan dimulai.
- Sebagai **dokter/perawat**, saya ingin mengubah status sebuah tahap menjadi "selesai" setelah tindakan dilakukan, agar progres rangkaian terlihat update.
- Sebagai **pengguna mana pun yang memiliki akses**, saya ingin melihat ringkasan jumlah tahap yang sudah selesai dari total tahap, agar saya cepat memahami progres pasien.

## 6. Functional requirements

### 6.1 Pembuatan rangkaian perawatan (modal awal)
- FR-1: Pengguna dapat membuat rangkaian baru dengan mengisi field nama/deskripsi rangkaian (wajib diisi, sudah ada di desain saat ini).
- FR-2: Setelah rangkaian disimpan, sistem mengarahkan pengguna ke halaman detail rangkaian untuk melanjutkan pengisian tahapan.

### 6.2 Daftar tahapan & tindakan
- FR-3: Pengguna (dokter) dapat menambahkan satu atau lebih tahap ke dalam rangkaian.
- FR-4: Setiap tahap memiliki nomor urut otomatis yang merepresentasikan kunjungan ke-berapa.
- FR-5: Setiap tahap dapat memuat satu atau lebih tindakan/prosedur, dipilih dari master data tindakan (bukan input teks bebas), untuk memastikan konsistensi data dan harga.
- FR-6: Pengguna dapat mengubah urutan tahap (drag & drop atau tombol naik/turun).
- FR-7: Pengguna dapat menghapus atau mengedit tahap yang belum berstatus "selesai". Tahap yang sudah selesai tidak dapat dihapus, hanya dapat diberi catatan tambahan (audit trail).

### 6.3 Jadwal kunjungan
- FR-8: Setiap tahap memiliki field tanggal kunjungan yang dapat dikosongkan saat pembuatan rangkaian dan diisi/diubah kemudian oleh admin.
- FR-9: Sistem menampilkan label "belum dijadwalkan" pada tahap yang tanggalnya belum diisi.
- FR-10: Saat tanggal kunjungan diisi atau diubah, sistem dapat terhubung dengan modul penjadwalan/booking yang sudah ada (jika tersedia) untuk menghindari konflik jadwal dokter.

### 6.4 Harga & estimasi biaya
- FR-11: Harga setiap tindakan otomatis terisi berdasarkan master data tarif tindakan saat tindakan dipilih.
- FR-12: Sistem menjumlahkan seluruh harga tindakan dalam rangkaian menjadi total estimasi biaya, ditampilkan secara real-time saat tahapan ditambah/diubah/dihapus.
- FR-13: Admin dapat memberikan diskon atau penyesuaian harga manual pada level rangkaian (dengan catatan alasan), bila diizinkan oleh kebijakan klinik.

### 6.5 Status & tracking progres
- FR-14: Setiap tahap memiliki status: **Belum**, **Berjalan**, atau **Selesai**.
- FR-15: Sistem menampilkan ringkasan progres rangkaian (contoh: "1 dari 4 tahap selesai") di bagian atas halaman detail.
- FR-16: Perubahan status tercatat dengan waktu dan nama pengguna yang mengubahnya (audit log).

## 7. Struktur data (high-level)

**Rangkaian Perawatan**
- id_rangkaian
- nama/deskripsi rangkaian
- id_pasien
- id_dokter_penanggung_jawab
- tanggal_dibuat
- status_keseluruhan (otomatis, berdasarkan status tahap)
- total_estimasi_biaya (kalkulasi)

**Tahap**
- id_tahap
- id_rangkaian (relasi)
- urutan_tahap
- tanggal_kunjungan (nullable)
- status (belum/berjalan/selesai)
- catatan

**Tindakan dalam tahap**
- id_tindakan_tahap
- id_tahap (relasi)
- id_master_tindakan (relasi ke master tarif)
- nama_tindakan (diturunkan dari master)
- harga (diturunkan dari master, dapat disesuaikan manual oleh admin dengan alasan)

## 8. Alur pengguna (user flow)

1. Dokter membuka pasien → memilih "Buat Rangkaian Perawatan" → mengisi nama rangkaian → simpan.
2. Sistem mengarahkan ke halaman detail rangkaian (masih kosong tahapannya).
3. Dokter menambahkan tahap pertama → memilih tindakan dari master data → harga otomatis muncul.
4. Dokter mengulangi langkah 3 untuk tahap-tahap selanjutnya sesuai rencana klinis.
5. Admin membuka rangkaian yang sama → mengisi tanggal kunjungan untuk tiap tahap sesuai booking pasien.
6. Setelah tindakan dilakukan, dokter/perawat mengubah status tahap menjadi "Selesai".
7. Sistem otomatis memperbarui ringkasan progres dan total biaya yang sudah berjalan vs belum.

## 9. Referensi desain

Wireframe halaman detail rangkaian perawatan (daftar tahap, jadwal, status, dan harga) telah didiskusikan dan dapat dijadikan acuan awal untuk tim desain UI/UX dalam membuat high-fidelity mockup.

## 10. Non-functional requirements

- **Permission**: akses tulis/edit pada tindakan klinis dibatasi untuk peran dokter (dan perawat bila diberi izin eksplisit); akses tulis pada jadwal dibatasi untuk peran admin.
- **Audit trail**: setiap perubahan status, tindakan, harga manual, dan jadwal harus tercatat (siapa, kapan, perubahan apa).
- **Konsistensi data**: tindakan harus dipilih dari master data, tidak boleh input bebas, untuk menghindari ketidaksesuaian harga dan pelaporan.
- **Performa**: halaman detail rangkaian dengan hingga puluhan tahap harus tetap responsif (di bawah 2 detik waktu muat).

## 11. Metrik keberhasilan

- Persentase rangkaian perawatan yang memiliki minimal 1 tahap terisi dalam 24 jam setelah dibuat (mengindikasikan adopsi fitur).
- Pengurangan jumlah komplain terkait estimasi biaya yang tidak transparan.
- Pengurangan waktu admin dalam proses penjadwalan ulang kunjungan lanjutan.

## 12. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Dokter merasa proses input tahapan terlalu panjang dan melewatkannya | Sediakan template rangkaian umum (misal: "Template Perawatan Saluran Akar") yang bisa langsung dipakai dan disesuaikan |
| Harga tindakan di master data belum lengkap/update | Validasi data master tarif sebelum rilis fitur, sediakan fallback input manual dengan flag "belum standar" |
| Tahap yang sudah dijadwalkan admin diubah dokter tanpa pemberitahuan | Tambahkan notifikasi internal antar role saat ada perubahan tahap yang sudah dijadwalkan |

## 13. Pertanyaan terbuka

- Apakah satu tahap dapat memiliki lebih dari satu tindakan, atau dibatasi satu tindakan per tahap?
- Apakah dibutuhkan template rangkaian perawatan standar per jenis kasus (root canal, scaling, ortodonti, dll) agar dokter tidak menyusun dari nol setiap kali?
- Apakah pasien perlu melihat rangkaian ini melalui portal pasien, atau cukup dikomunikasikan secara manual oleh admin/dokter?
- Bagaimana penanganan jika tahap dibatalkan di tengah jalan (misalnya pasien pindah klinik)?

## 14. Lampiran

- Tangkapan layar modal "Buat Rangkaian Perawatan" (kondisi saat ini, sebagai baseline).
- Diskusi awal kebutuhan fitur (referensi internal tim produk).
