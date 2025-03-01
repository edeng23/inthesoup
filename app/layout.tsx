import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'In the Soup',
  description: 'In the Soup for Love',
  generator: 'EdenG',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon/icon.webp', type: 'image/webp' }
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [{ url: '/icon/icon.webp' }]
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon/icon.webp" />
      </head>
      <body>{children}</body>
    </html>
  )
}
