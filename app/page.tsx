// app/page.tsx - Fixed with server-side auth check
import Portfolio from '@/components/Portfolio'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Contact from '@/components/Contact'
import { getCategories } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  // ✅ Get session on server side to check admin status
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN'
  
  console.log('🏠 Homepage Server Auth Check:', {
    hasSession: !!session,
    userEmail: session?.user?.email,
    userRole: session?.user?.role,
    isAdmin
  })
  
  // ✅ Pass includePrivate=true if user is admin
  const categories = await getCategories(isAdmin)
  
  console.log('📊 Homepage Categories Fetched:', {
    totalCategories: categories.length,
    privateCategories: categories.filter(cat => cat.isPrivate).length,
    isAdmin
  })

  return (
    <>
      <Hero />
      <Portfolio categories={categories} />
      <About />
      <Contact />
    </>
  )
}