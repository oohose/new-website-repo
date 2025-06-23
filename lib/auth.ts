import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
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

        // Check if this is the admin login
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          // Find or create admin user
          let adminUser = await db.user.findUnique({
            where: { email: credentials.email }
          })

          if (!adminUser) {
            adminUser = await db.user.create({
              data: {
                email: credentials.email,
                name: 'Admin',
                role: 'ADMIN'
              }
            })
          }

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role
          }
        }

        // For non-admin users, check database with hashed password
        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        // Note: If you want to support regular users with hashed passwords,
        // you would compare them here. For now, only admin login is supported.
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    }
  },
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/admin/login'
  }
}

declare module 'next-auth' {
  interface User {
    role: string
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
    }
  }
}