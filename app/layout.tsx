import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'In the Soup',
  description: 'In the Soup for Love',
  generator: 'EdenG',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
