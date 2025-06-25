'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'

export default function ModernNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/#portfolio', label: 'Portfolio' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className={`text-xl lg:text-2xl font-light tracking-wide transition-colors duration-300 ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                Peyton Snipes
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-light tracking-wide transition-colors duration-300 hover:opacity-70 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Admin/User Menu */}
              {session ? (
                <div className="flex items-center space-x-4">
                  {(session.user as any)?.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className={`p-2 rounded-full transition-colors duration-300 ${
                        isScrolled 
                          ? 'text-gray-900 hover:bg-gray-100' 
                          : 'text-white hover:bg-white/10'
                      }`}
                      title="Admin Panel"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className={`p-2 rounded-full transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-900 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/10'
                    }`}
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/admin/signin"
                  className={`p-2 rounded-full transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-900 hover:bg-gray-100' 
                      : 'text-white hover:bg-white/10'
                  }`}
                  title="Admin Sign In"
                >
                  <User className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden p-2 rounded-md transition-colors duration-300 ${
                isScrolled 
                  ? 'text-gray-900 hover:bg-gray-100' 
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-lg font-light text-gray-900">Menu</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 py-6">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="block px-6 py-3 text-gray-900 hover:bg-gray-50 transition-colors duration-200 font-light"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Auth Section */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    {session ? (
                      <div className="space-y-1">
                        <div className="px-6 py-2">
                          <p className="text-sm font-medium text-gray-900">
                            {(session.user as any)?.name || session.user?.email}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {(session.user as any)?.role?.toLowerCase() || 'user'}
                          </p>
                        </div>
                        
                        {(session.user as any)?.role === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 mr-3" />
                            Admin Panel
                          </Link>
                        )}
                        
                        <button
                          onClick={() => {
                            signOut()
                            setIsOpen(false)
                          }}
                          className="flex items-center w-full px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <Link
                        href="/admin/signin"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Admin Sign In
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}