import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCategories, getAllImages } from '@/lib/db'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/admin/login')
  }

  // Fetch admin data (including private categories)
  const [categories, allImages] = await Promise.all([
    getCategories(true), // Include private categories
    getAllImages(true)   // Include images from private categories
  ])

  return (
    <AdminDashboard
      categories={categories}
      images={allImages}
      user={session.user}
    />
  )
}