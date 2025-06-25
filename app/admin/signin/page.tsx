import { Metadata } from 'next'
import AdminSignIn from './AdminSignIn'

export const metadata: Metadata = {
  title: 'Admin Sign In',
  description: 'Admin authentication for portfolio management',
}

export default function AdminSignInPage() {
  return <AdminSignIn />
}