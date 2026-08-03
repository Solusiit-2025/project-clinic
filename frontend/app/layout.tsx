import type { Metadata } from 'next'
import '@/styles/globals.css'
import Script from 'next/script'

import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Klinik Yasfina - Pelayanan Kesehatan & Rumah Sunat Modern',
  description: 'Klinik Yasfina Pusat melayani Pengobatan Umum, Poli Gigi, dan Pusat Rumah Sunat Modern minim rasa sakit dengan fasilitas modern & tenaga medis berpengalaman.',
  icons: {
    icon: '/logo-yasfina_web.png',
    shortcut: '/logo-yasfina_web.png',
    apple: '/logo-yasfina_web.png',
  },
  openGraph: {
    title: 'Klinik Yasfina - Pelayanan Kesehatan & Rumah Sunat Modern',
    description: 'Layanan Pengobatan Umum, Poli Gigi, & Rumah Sunat Modern. Booking Online Tanpa Antre!',
    url: 'http://localhost:3006',
    siteName: 'Klinik Yasfina',
    images: [
      {
        url: '/logo-yasfina_web.png',
        width: 800,
        height: 600,
        alt: 'Klinik Yasfina Logo',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <Script
          id="theme-strategy"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('clinic-theme');
                  var theme = raw ? JSON.parse(raw)?.state?.theme : null;
                  if (!theme) {
                    theme = 'light';
                  }
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Anti-flicker: runs synchronously before paint to apply stored theme */}
        <link rel="icon" href="/logo-yasfina_web.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }, function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="overflow-x-hidden" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
