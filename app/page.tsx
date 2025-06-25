import Portfolio from '@/components/Portfolio'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Contact from '@/components/Contact'
import { getCategories } from '@/lib/db'

export default async function HomePage() {
  const categories = await getCategories()

  return (
    <>
      <Hero />
      <Portfolio categories={categories} />
      <About />
      <Contact />
    </>
  )
}
