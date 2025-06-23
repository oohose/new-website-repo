import { Suspense } from 'react'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import Portfolio from '@/components/Portfolio'
import About from '@/components/About'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { getCategories, getPublicImages } from '@/lib/db'

export default async function HomePage() {
  // Fetch initial data for the portfolio
  const [categories, recentImages] = await Promise.all([
    getCategories(false), // Only public categories
    getPublicImages()
  ])

  return (
    <main className="min-h-screen bg-dark-gradient">
      <Navigation />
      
      <Suspense fallback={<div className="h-screen bg-hero-gradient animate-pulse" />}>
        <Hero />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-900 animate-pulse" />}>
        <Portfolio categories={categories} recentImages={recentImages} />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-800 animate-pulse" />}>
        <About />
      </Suspense>

      <Suspense fallback={<div className="h-96 bg-gray-900 animate-pulse" />}>
        <Contact />
      </Suspense>

      <Footer />
    </main>
  )
}