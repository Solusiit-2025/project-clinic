export const siteConfig = {
  brandName: 'Klinik Yasfina Pusat',
  brandShort: 'Klinik Yasfina',
  slogan: 'Pelayanan Kesehatan Profesional & Terpercaya',
  description:
    'Klinik Yasfina Pusat menyediakan layanan kesehatan berkualitas dengan dokter berpengalaman, teknologi medis terkini, dan pelayanan sepenuh hati.',
  navItems: [
    { label: 'Beranda', href: '#home' },
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Rumah Sunat', href: '#circumcision' },
    { label: 'Layanan', href: '#services' },
    { label: 'Dokter & Jadwal', href: '#doctors' },
    { label: 'Kontak', href: '#contact' },
  ],
  hero: {
    preTitle: 'Selamat Datang di Klinik Yasfina',
    title: 'Kesehatan Anda adalah',
    highlight: 'Prioritas Utama Kami',
    description:
      'Kami hadir untuk memberikan solusi kesehatan yang komprehensif bagi Anda dan keluarga. Dengan tim dokter spesialis dan fasilitas modern, kami siap melayani kebutuhan medis Anda.',
    primaryCta: 'Buat Janji Temu',
    primaryHref: '/register',
    secondaryCta: 'Layanan Kami',
    secondaryHref: '#services',
    stats: [
      { value: '15+', label: 'Tahun Pengalaman', color: 'text-primary' },
      { value: '25+', label: 'Dokter Spesialis', color: 'text-secondary' },
      { value: '50K+', label: 'Pasien Terlayani', color: 'text-green-600' },
    ],
  },
  features: [
    {
      icon: 'heart',
      title: 'Pelayanan Ramah',
      description: 'Tenaga medis kami berdedikasi memberikan pelayanan yang hangat dan bersahabat.',
    },
    {
      icon: 'clock',
      title: 'Tanpa Antre Lama',
      description: 'Sistem booking online kami memastikan Anda mendapatkan penanganan tepat waktu.',
    },
    {
      icon: 'award',
      title: 'Dokter Ahli',
      description: 'Ditangani oleh dokter-dokter berpengalaman dan tersertifikasi di bidangnya.',
    },
  ],
  services: [
    {
      number: '01',
      title: 'Rumah Sunat Modern',
      description: 'Pusat khitan modern dengan berbagai metode canggih dan minim rasa sakit untuk segala usia.',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      number: '02',
      title: 'Pengobatan Umum',
      description: 'Konsultasi kesehatan rutin dan penanganan penyakit umum oleh dokter berpengalaman.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      number: '03',
      title: 'Poli Gigi',
      description: 'Perawatan kesehatan gigi menyeluruh mulai dari pembersihan hingga prosedur ortodontik.',
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      number: '04',
      title: 'Laboratorium & Farmasi',
      description: 'Fasilitas diagnostik akurat dan ketersediaan obat-obatan lengkap berkualitas.',
      gradient: 'from-teal-500 to-emerald-500',
    },
  ],
  circumcision: {
    badge: 'Rumah Sunat Modern Yasfina',
    title: 'Sunat Aman, Nyaman &',
    highlight: 'Minim Trauma Anak',
    description:
      'Pusat khitan modern dengan pilihan metode medis terkini, dokter berpengalaman, ruangan khusus anak yang menyenangkan, dan harga transparan sudah termasuk obat + kontrol.',
    methods: [
      {
        name: 'Laser Thermocauter',
        short: 'Laser',
        desc: 'Metode laser paling populer untuk anak & dewasa.',
        detail:
          'Metode yang dilakukan menggunakan alat laser, pada penyelesaiannya dilakukan penjahitan. Keunggulannya pendarahan sangat minimal, penyembuhan luka cepat dan tidak ada angkat jahitan.',
        advantages: ['Pendarahan Sangat Minimal', 'Penyembuhan Cepat', 'Tanpa Angkat Jahitan'],
        price: 'Mulai Rp 900.000',
        priceNote: 'Anak 0–10 th: Rp 900rb – Rp 1,1 jt',
      },
      {
        name: 'Tekno Klamp',
        short: 'Klamp',
        desc: 'Tabung Smart Klemp single-use, boleh kena air.',
        detail:
          'Metode ini menggunakan tabung Smart Klemp dengan beberapa ukuran sesuai usia dan ukuran penis dan alat bersifat SINGLE USE ONLY. Penguncian klemp dilakukan selama 3–5 hari, setelah itu dilepas. Keunggulannya boleh terkena air.',
        advantages: ['Single Use Only', 'Boleh Terkena Air', 'Dilepas 3–5 Hari'],
        price: 'Konsultasi Dulu',
        priceNote: 'Disesuaikan ukuran & usia',
      },
      {
        name: 'Pen Sealer (Lem)',
        short: 'Lem',
        desc: 'Inovasi lem kulit medis tanpa jahit.',
        detail:
          'Metode inovasi terbaru dengan menggunakan lem kulit yang sudah lazim digunakan untuk operasi-operasi besar. Setelah kulup dipotong kemudian dilakukan pemberian lem di sekitar potongan kulit tadi. Metode praktis tanpa jahit dan waktu singkat.',
        advantages: ['Tanpa Jahit Sama Sekali', 'Waktu Tindakan Singkat', 'Lem Medis Steril'],
        price: 'Rp 1.300.000',
        priceNote: 'Flat, sudah termasuk obat + kontrol',
      },
      {
        name: 'Stapler',
        short: 'Stapler',
        desc: 'Alat lonceng presisi, jahit otomatis.',
        detail:
          'Metode ini menggunakan alat yang berbentuk lonceng dengan 2 bagian, lonceng bagian dalam berfungsi melindungi kepala penis, dan bagian luar untuk memotong kulup. Staples digunakan untuk menjahit dan menghentikan pendarahan.',
        advantages: ['Melindungi Kepala Penis', 'Potong + Jahit Otomatis', 'Pendarahan Minimal'],
        price: 'Konsultasi Dulu',
        priceNote: 'Disesuaikan usia & kondisi',
      },
    ],
    pricingAnak: [
      { label: 'Laser Thermocauter (0 s/d 10 th)', price: 'Rp 900.000 – Rp 1.100.000' },
      { label: 'Metode Khusus Anak Gemuk', price: 'Rp 1.300.000 – Rp 1.600.000' },
      { label: 'Metode Khusus Bayi', price: 'Rp 1.300.000' },
      { label: 'Metode Pen Sealer (Lem)', price: 'Rp 1.300.000' },
    ],
    pricingDewasa: [
      { label: 'Laser Thermocauter Dewasa', price: 'Rp 1.550.000 – Rp 2.050.000' },
      { label: 'Laser Thermocauter Remaja 11–15 th', price: 'Rp 1.300.000' },
    ],
    included: ['Dokter', 'Perawatan', 'Celana Khitan', 'Obat-obatan', 'Kontrol 1x Setelah Khitan'],
    facilityTitle: 'Ruangan Khusus Anak, Suasana Menyenangkan',
    facilityDesc:
      'Suasana yang menyenangkan, serta menyediakan ruangan khusus anak-anak agar tidak takut pada saat menunggu maupun saat proses khitan berlangsung.',
    facilityPoints: ['Ruang tunggu ramah anak', 'Proses didampingi & edukatif', 'Privasi terjaga'],
    services: [
      'Sunat Bayi', 'Sunat Anak', 'Sunat Dewasa', 'Sunat Berkebutuhan Khusus',
      'Sunat di Rumah', 'Sunat Revisi', 'Sunat Perempuan', 'Sunat Gemuk',
      'Kontrol Post Sunat', 'Sunatan Massal', 'Sunat Gratis'
    ]
  },
  contact: {
    phone: '(0251) 8666169',
    whatsapp: '6281299441313',
    whatsappFormatted: '+62 812-9944-1313',
    email: 'info@yasfina.com',
    address: 'Blok EE1, Jl. Villa Bogor Indah, RT.01/RW.14, Kedunghalang, Kec. Bogor Utara, Kota Bogor, Jawa Barat 16157',
    hours: 'Senin - Minggu : 08:00 - 21:00',
  },
  footerLinks: [
    { label: 'Beranda', href: '#home' },
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Layanan Medis', href: '#services' },
    { label: 'Fasilitas', href: '#facilities' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Syarat & Ketentuan', href: '/terms' },
  ],
  about: {
    title: 'Tentang Klinik Yasfina',
    description: 'Berdiri sejak 2008, Klinik Yasfina telah menjadi mitra kesehatan terpercaya bagi ribuan keluarga. Kami berkomitmen untuk memberikan layanan medis berkualitas tinggi yang mengedepankan keamanan, kenyamanan, dan inovasi.',
    mission: 'Menyelenggarakan pelayanan kesehatan yang paripurna, bermutu, dan terjangkau dengan mengutamakan kepuasan pasien.',
    vision: 'Menjadi klinik pelayanan primer pilihan utama masyarakat dengan standar kualitas pelayanan yang unggul.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000'
  },
  facilities: [
    {
      title: 'Ruang Tindakan & Konsultasi',
      description: 'Ruang konsultasi dokter dan tindakan medis yang steril, nyaman, dan ber-AC.',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000'
    },
    {
      title: 'Peralatan Medis Modern',
      description: 'Didukung dengan teknologi medis terkini untuk diagnosis yang akurat dan cepat.',
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1000'
    },
    {
      title: 'Apotek Terintegrasi',
      description: 'Apotek dengan ketersediaan obat lengkap dan layanan konsultasi apoteker.',
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1000'
    }
  ],
  faq: [
    {
      question: 'Apakah Klinik Yasfina menerima pendaftaran pasien baru?',
      answer: 'Ya, kami selalu terbuka untuk pasien baru. Anda dapat mendaftar langsung di klinik atau melalui sistem pendaftaran online kami.'
    },
    {
      question: 'Bagaimana cara membuat janji temu dengan dokter?',
      answer: 'Anda dapat membuat janji temu melalui website ini dengan mengklik tombol "Buat Janji Temu" atau menghubungi nomor kontak kami.'
    },
    {
      question: 'Apakah Klinik Yasfina buka pada hari libur?',
      answer: 'Kami buka dari Senin hingga Minggu, pukul 08:00 - 21:00. Untuk layanan gawat darurat, silakan langsung menuju fasilitas UGD terdekat.'
    },
    {
      question: 'Apa saja layanan unggulan di Klinik Yasfina?',
      answer: 'Layanan unggulan kami meliputi pemeriksaan umum, perawatan gigi, layanan laboratorium, dan fasilitas apotek yang lengkap.'
    }
  ]
}
