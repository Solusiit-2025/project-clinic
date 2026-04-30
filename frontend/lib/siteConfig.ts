export const siteConfig = {
  brandName: 'Klinik Yasfina',
  brandShort: 'Klinik Yasfina',
  slogan: 'Pelayanan Kesehatan Profesional & Terpercaya',
  description:
    'Klinik Yasfina menyediakan layanan kesehatan berkualitas dengan dokter berpengalaman, teknologi medis terkini, dan pelayanan sepenuh hati.',
  navItems: [
    { label: 'Beranda', href: '#home' },
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Rumah Sunat', href: '#circumcision' },
    { label: 'Layanan', href: '#services' },
    { label: 'Dokter', href: '#doctors' },
    { label: 'Jadwal Dokter', href: '#schedule' },
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
    methods: [
      { 
        name: 'Sunat Konvensional', 
        desc: 'Metode standar medis yang sudah teruji.', 
        advantages: ['Sesuai Prosedur Medis', 'Biaya Terjangkau', 'Penyembuhan Alami'],
        detail: 'Metode khitan tradisional menggunakan pisau/gunting bedah steril dengan teknik jahitan presisi untuk hasil yang aman.'
      },
      { 
        name: 'Sunat Cauter (Laser)', 
        desc: 'Metode paling populer dengan teknologi panas.', 
        advantages: ['Minim Perdarahan', 'Proses Cepat', 'Tanpa Luka Bakar'],
        detail: 'Menggunakan alat cauter modern untuk memotong sekaligus menghentikan perdarahan secara instan. Sangat efektif dan efisien.'
      },
      { 
        name: 'Sunat Klamp', 
        desc: 'Khitan tanpa jahitan, praktis & aman.', 
        advantages: ['Tanpa Jahitan & Perban', 'Bisa Langsung Mandi', 'Bisa Langsung Sekolah'],
        detail: 'Menggunakan alat klamp plastik sekali pakai yang dipasang pada organ. Tanpa jahitan, tanpa perban, dan anak bisa langsung beraktivitas.'
      },
      { 
        name: 'Sunat Bipolar', 
        desc: 'Teknologi bedah rumah sakit untuk khitan.', 
        advantages: ['Minim Trauma Jaringan', 'Sembuh Lebih Cepat', 'Hasil Sangat Rapi'],
        detail: 'Menggunakan teknologi Bipolar Scissors yang memotong sekaligus mengkoagulasi jaringan tanpa merusak sel di sekitarnya.'
      },
      { 
        name: 'Sunat Stapler', 
        desc: 'Metode sekali pakai paling canggih.', 
        advantages: ['Proses 5-10 Menit', 'Hasil Sangat Estetik', 'Alat Sekali Pakai'],
        detail: 'Teknologi terbaru yang memotong dan memasang silicon ring/staple secara otomatis. Hasil paling rapi dan proses sangat singkat.'
      },
      { 
        name: 'Sunat Fine Sealer', 
        desc: 'Inovasi terbaru dengan lem medis.', 
        advantages: ['Tanpa Jahitan Sama Sekali', 'Sangat Estetik', 'Penyembuhan Maksimal'],
        detail: 'Metode khitan tanpa jahitan yang menggunakan cairan perekat (lem) khusus medis. Memberikan hasil akhir yang sangat mulus dan estetik.'
      },
    ],
    services: [
      'Sunat Bayi', 'Sunat Anak', 'Sunat Dewasa', 'Sunat Berkebutuhan Khusus', 
      'Sunat di Rumah', 'Sunat Revisi', 'Sunat Perempuan', 'Sunat Gemuk', 
      'Kontrol Post Sunat', 'Sunatan Massal', 'Sunat Gratis'
    ]
  },
  contact: {
    phone: '+62 812-3456-7890',
    email: 'kontak@sehatselalu.com',
    address: 'Jl. Merdeka No. 45, Jakarta Selatan',
    hours: 'Senin - Sabtu: 08:00 - 21:00',
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
      title: 'Ruang Rawat Inap Nyaman',
      description: 'Fasilitas rawat inap yang dirancang khusus untuk kenyamanan dan pemulihan optimal.',
      image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=1000'
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
      answer: 'Kami buka dari Senin hingga Sabtu, pukul 08:00 - 21:00. Untuk layanan gawat darurat, silakan langsung menuju fasilitas UGD terdekat.'
    },
    {
      question: 'Apa saja layanan unggulan di Klinik Yasfina?',
      answer: 'Layanan unggulan kami meliputi pemeriksaan umum, perawatan gigi, layanan laboratorium, dan fasilitas apotek yang lengkap.'
    }
  ]
}
