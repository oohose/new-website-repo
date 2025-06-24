'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Camera } from 'lucide-react'
import { siteConfig } from '@/config/site'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <button
              onClick={scrollToTop}
              className="text-2xl font-bold gradient-text tracking-wider"
            >
              {siteConfig.photographer.name.toUpperCase()}
            </button>
            <p className="text-white/60 text-sm leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="flex items-center space-x-1 text-white/40 text-sm">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span>and</span>
              <Camera className="w-4 h-4 text-primary-400" />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <nav className="space-y-2">
              {siteConfig.navigation.main.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href.replace('#', ''))}
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  {link.name}
                </button>
              ))}
              <Link
                href="/galleries"
                className="block text-white/60 hover:text-white transition-colors text-sm"
              >
                All Galleries
              </Link>
            </nav>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Get in Touch</h3>
            <div className="space-y-2 text-sm">
              <a
                href={`mailto:${siteConfig.photographer.email}`}
                className="block text-white/60 hover:text-primary-400 transition-colors"
              >
                {siteConfig.photographer.email}
              </a>
              <a
                href={`tel:${siteConfig.photographer.phone}`}
                className="block text-white/60 hover:text-primary-400 transition-colors"
              >
                {siteConfig.photographer.phone}
              </a>
              <p className="text-white/60">
                {siteConfig.photographer.location}
              </p>
            </div>

            {/* Business Hours */}
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-white mb-2">Business Hours</h4>
              <div className="text-xs text-white/60 space-y-1">
                <div>Mon - Fri: 9:00 AM - 6:00 PM</div>
                <div>Saturday: 10:00 AM - 4:00 PM</div>
                <div>Sunday: By Appointment</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
        >
          <p className="text-white/40 text-sm">
            {siteConfig.footer.copyright}
          </p>
          
          <div className="flex items-center space-x-6 text-sm text-white/40">
            {siteConfig.navigation.footer.map((link) => (
              <Link 
                key={link.name}
                href={link.href} 
                className="hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={scrollToTop}
              className="hover:text-white transition-colors"
            >
              Back to Top
            </button>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}