import type { Metadata } from 'next'
import '@/styles/globals.css'

import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Klinik Yasfina - Website Klinik Profesional',
  description: 'Sistem Manajemen Klinik Profesional - Antrian Online, Pendaftaran, Inventory, Keuangan',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-flicker: runs synchronously before paint to apply stored theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('clinic-theme');
                  var theme = raw ? JSON.parse(raw)?.state?.theme : null;
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="http://localhost:5004" />
        <link rel="dns-prefetch" href="http://localhost:5004" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
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
