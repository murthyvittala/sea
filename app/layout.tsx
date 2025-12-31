import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEO Analytics - Monitor Your Website Performance',
  description: 'Real-time SEO Analytics Dashboard with GA4, GSC, and PageSpeed integration',
  keywords: 'SEO, Analytics, Google Analytics, Search Console, PageSpeed',
  authors: [{ name: 'SEO Analytics Team' }],
  creator: 'SEO Analytics',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://seoanalytics.com',
    title: 'SEO Analytics',
    description: 'Monitor your website SEO performance in real-time',
  },
}

// Move viewport to its own export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
