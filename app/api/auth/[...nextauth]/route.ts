// File: app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Get admin credentials from environment variables
        const adminEmail = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD
        const adminName = process.env.ADMIN_NAME || 'Admin'

        if (!adminEmail || !adminPassword) {
          console.error('Admin credentials not found in environment variables')
          return null
        }

        // Check if credentials match admin credentials
        if (credentials.email === adminEmail && credentials.password === adminPassword) {
          return {
            id: 'admin',
            email: adminEmail,
            name: adminName,
            role: 'ADMIN',
          }
        }

        // Invalid credentials
        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/signin',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }