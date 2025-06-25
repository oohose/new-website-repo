import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// ❗ DON'T export `authOptions` here — Vercel's App Router build doesn't allow it
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
