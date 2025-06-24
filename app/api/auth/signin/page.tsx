'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { siteConfig } from '@/config/site'
import toast from 'react-hot-toast'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials')
      } else {
        toast.success('Signed in successfully')
        router.push('/admin')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-gray-800 rounded-lg p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Admin Sign In
          </h1>
          <p className="text-gray-400">
            Access the {siteConfig.name} admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 spinner" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to website
          </button>
        </div>
      </motion.div>
    </div>
  )
}