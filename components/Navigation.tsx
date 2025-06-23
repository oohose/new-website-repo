'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut } from 'lucide-react'
import { siteConfig } from '@/lib/utils'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'nav-scrolled' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-xl lg:text-2xl font-bold gradient-text tracking-wider"
          >
            {siteConfig.photographer.name.toUpperCase()}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link
              href="#home"
              onClick={(e) => handleSmoothScroll(e, '#home')}
              className="text-white hover:text-primary-400 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="#portfolio"
              onClick={(e) => handleSmoothScroll(e, '#portfolio')}
              className="text-white hover:text-primary-400 transition-colors font-medium"
            >
              Portfolio
            </Link>
            <Link
              href="#about"
              onClick={(e) => handleSmoothScroll(e, '#about')}
              className="text-white hover:text-primary-400 transition-colors font-medium"
            >
              About
            </Link>
            <Link
              href="#contact"
              onClick={(e) => handleSmoothScroll(e, '#contact')}
              className="text-white hover:text-primary-400 transition-colors font-medium"
            >
              Contact
            </Link>
            
            {/* Admin Section */}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-white hover:text-primary-400 transition-colors font-medium"
              >
                Admin
              </Link>
            )}

            {/* Auth Button */}
            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="w-8 h-8 spinner" />
              ) : session ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-white/80">
                    {session.user.name || session.user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-1 text-white hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex items-center space-x-1 btn-ghost text-sm"
                >
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-white hover:text-primary-400 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/95 backdrop-blur-lg rounded-lg mt-2">
              <Link
                href="#home"
                onClick={(e) => handleSmoothScroll(e, '#home')}
                className="block px-3 py-2 text-white hover:text-primary-400 transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                href="#portfolio"
                onClick={(e) => handleSmoothScroll(e, '#portfolio')}
                className="block px-3 py-2 text-white hover:text-primary-400 transition-colors font-medium"
              >
                Portfolio
              </Link>
              <Link
                href="#about"
                onClick={(e) => handleSmoothScroll(e, '#about')}
                className="block px-3 py-2 text-white hover:text-primary-400 transition-colors font-medium"
              >
                About
              </Link>
              <Link
                href="#contact"
                onClick={(e) => handleSmoothScroll(e, '#contact')}
                className="block px-3 py-2 text-white hover:text-primary-400 transition-colors font-medium"
              >
                Contact
              </Link>
              
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 text-white hover:text-primary-400 transition-colors font-medium"
                >
                  Admin
                </Link>
              )}

              <div className="border-t border-white/20 pt-2">
                {session ? (
                  <div className="px-3 py-2">
                    <div className="text-sm text-white/80 mb-2">
                      {session.user.name || session.user.email}
                    </div>
                    <button
                      onClick={() => {
                        signOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center space-x-1 text-white hover:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      signIn()
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center space-x-1 text-white hover:text-primary-400 transition-colors px-3 py-2"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}