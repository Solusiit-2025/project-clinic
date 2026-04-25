export const siteConfig = {
  brandName: 'Klinik Yasfina',
  brandShort: 'Klinik Yasfina',
  slogan: 'Pelayanan Kesehatan Profesional & Terpercaya',
  description:
    'Klinik Yasfina menyediakan layanan kesehatan berkualitas dengan dokter berpengalaman, teknologi medis terkini, dan pelayanan sepenuh hati.',
  navItems: [
    { label: 'Beranda', href: '#home' },
    { label: 'Tentang Kami', href: '#about' },
    { label: 'Layanan', href: '#services' },
    { label: 'Dokter', href: '#doctors' },
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
      title: 'Pemeriksaan Umum',
      description: 'Konsultasi kesehatan rutin dan penanganan penyakit umum oleh dokter berpengalaman.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      number: '02',
      title: 'Layanan Gigi',
      description: 'Perawatan kesehatan gigi menyeluruh mulai dari pembersihan hingga prosedur ortodontik.',
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      number: '03',
      title: 'Laboratorium',
      description: 'Fasilitas cek darah, urin, dan berbagai tes diagnostik dengan hasil yang akurat.',
      gradient: 'from-teal-500 to-green-500',
    },
    {
      number: '04',
      title: 'Farmasi',
      description: 'Ketersediaan obat-obatan lengkap dan berkualitas langsung di apotek klinik kami.',
      gradient: 'from-green-500 to-emerald-500',
    },
  ],
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
    { label: 'Syarat & Ketentuan', href: '/terms' },
  ],
}
