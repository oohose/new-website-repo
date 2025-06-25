import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    const newCategory = await db.category.create({ data: body })

    return new Response(JSON.stringify({ success: true, category: newCategory }), { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Create category error:', error.message)
    } else {
      console.error('Unknown category creation error:', error)
    }
    return new Response(JSON.stringify({ success: false }), { status: 500 })
  }
}
