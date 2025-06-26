'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { signIn, signOut, useSession, getSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

export default function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isModalOpen) {
      setIsVisible(true)
    }
  }, [isModalOpen])

  const closeModal = () => {
    setIsVisible(false)
    setTimeout(() => {
      setIsModalOpen(false)
    }, 200) // match transition duration
  }

  const hiddenPaths = ['/admin/login']
  const shouldHideNav = hiddenPaths.includes(pathname)
  if (shouldHideNav) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error || 'Login failed')
      } else {
        await getSession()
        closeModal()
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 backdrop-blur-md border-b ${
          isScrolled
            ? 'bg-white/10 border-white/10 shadow-sm'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-white">
            <h1
              className={`text-xl font-bold transition-all ${
                isScrolled ? 'drop-shadow-md' : ''
              }`}
            >
              Peyton Snipes
            </h1>
          </Link>

          <div className="flex items-center space-x-4">
            {pathname !== '/' && (
              <Link href="/">
                <span
                  className={`text-sm font-medium transition-all px-4 py-2 rounded-md ${
                    isScrolled
                      ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Home
                </span>
              </Link>
            )}

            {session && (
              <Link href="/admin">
                <span
                  className={`text-sm font-medium transition-all px-4 py-2 rounded-md ${
                    isScrolled
                      ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Admin Panel
                </span>
              </Link>
            )}

            {session ? (
              <button
                onClick={() => signOut()}
                className={`text-sm font-medium transition-all px-4 py-2 rounded-md ${
                  isScrolled
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className={`text-sm font-medium transition-all px-4 py-2 rounded-md ${
                  isScrolled
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal with animation */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-neutral-900 text-white rounded-xl p-8 w-full max-w-lg border border-white/10 shadow-2xl transform transition-all duration-200 ${
              isVisible
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <h2 className="text-xl font-semibold mb-6 text-white">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="block text-sm mb-1 text-white/80">
                  Email
                </label>
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent text-white border-2 border-white/20 rounded-md placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-purple-500 transition-all"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm mb-1 text-white/80">
                  Password
                </label>
                <input
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent text-white border-2 border-white/20 rounded-md placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-purple-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-between items-center mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-colors text-white"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
