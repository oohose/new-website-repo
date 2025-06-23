'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function Hero() {
  const handleScrollToPortfolio = () => {
    const portfolioSection = document.getElementById('portfolio')
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-gradient" />

      <div className="bg-blue-500 text-white p-4 rounded">
  TEST: This should be blue with white text
</div>
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grain' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.1)'/%3E%3Ccircle cx='80' cy='40' r='0.5' fill='rgba(255,255,255,0.08)'/%3E%3Ccircle cx='40' cy='80' r='1.5' fill='rgba(255,255,255,0.05)'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grain)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 tracking-wide text-shadow-lg"
        >
          Capturing Moments
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl lg:text-2xl text-white/90 mb-10 text-shadow tracking-wide"
        >
          Professional Photography That Tells Your Story
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          onClick={handleScrollToPortfolio}
          className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold text-lg rounded-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 text-shadow"
        >
          <span className="relative z-10">View My Work</span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.button
          onClick={handleScrollToPortfolio}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/70 hover:text-white transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-16 h-16 bg-white/5 rounded-full backdrop-blur-sm"
      />
      
      <motion.div
        animate={{
          y: [0, 15, 0],
          rotate: [0, -3, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/5 rounded-full backdrop-blur-sm"
      />
      
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, 8, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
        className="absolute bottom-1/3 left-1/6 w-20 h-20 bg-white/5 rounded-full backdrop-blur-sm"
      />
    </section>
  )
}