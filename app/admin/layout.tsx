import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/app/providers'
import { Toaster } from 'react-hot-toast'
import { siteConfig } from '@/config/site'

// Try multiple import approaches to debug
// Uncomment ONE at a time to test:

// Option 1: Original import
// import ModernNavigation from '@/components/Navigation'

// Option 2: Relative path import
// import ModernNavigation from '../components/Navigation'

// Option 3: Simple inline test component
function TestNav() {
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-4 text-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'red',
        color: 'white',
        padding: '16px',
        textAlign: 'center'
      }}
    >
      🚨 LAYOUT IS WORKING - Navigation should appear here! 🚨
    </div>
  )
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: siteConfig.seo.keywords,
  authors: [{ name: siteConfig.photographer.name }],
  creator: siteConfig.photographer.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🔍 RootLayout is rendering!') // Debug log
  
  return (
    <html lang="en" className={siteConfig.theme.darkMode ? "dark" : ""}>
      <body className={inter.className}>
        <Providers>
          {/* Start with inline test component */}
          <TestNav />
          
          {/* Once TestNav works, comment it out and try: */}
          {/* <ModernNavigation /> */}
          
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
              },
              success: {
                iconTheme: {
                  primary: '#14b8a6',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}