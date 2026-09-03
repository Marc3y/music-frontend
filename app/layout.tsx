import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { PlayerProvider } from '@/lib/player-context'
import { ThemeProvider } from '@/lib/theme-context'
import { GlobalPlayer } from '@/components/player/global-player'
import { AppToaster } from '@/components/app-toaster'
import './globals.css'

// Loaded as the fallback for non-Apple platforms; Apple devices use their
// native SF Pro via the `-apple-system` entry in --font-sans (globals.css).
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'music — stream your sound',
  description:
    'A modern, minimal home for your music. Create playlists, upload tracks, and stream them anywhere.',
}

export const viewport: Viewport = {
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f3f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0d14' },
  ],
}

const themeScript = `(function(){try{var t=localStorage.getItem('music.theme');var d=t?t==='dark':true;var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){document.documentElement.classList.add('dark')}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <PlayerProvider>
              {children}
              <GlobalPlayer />
            </PlayerProvider>
          </AuthProvider>
          <AppToaster />
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
