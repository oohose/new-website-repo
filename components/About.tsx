'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { siteConfig } from '@/config/site'

export default function About() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Sample about images - in production, these would come from your portfolio
  const aboutImages = [
    '/api/placeholder/600/800', // Replace with actual photographer images
    '/api/placeholder/600/800',
    '/api/placeholder/600/800',
  ]

  useEffect(() => {
    setMounted(true)
    
    if (aboutImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % aboutImages.length)
      }, 4000)
      
      return () => clearInterval(interval)
    }
  }, [aboutImages.length])

  if (!mounted) {
    return <div className="h-96 bg-gray-800 animate-pulse" />
  }

  return (
    <section id="about" className="py-20 lg:py-32 bg-gradient-to-b from-gray-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white gradient-text">
              About {siteConfig.photographer.name.split(' ')[0]}
            </h2>
            
            <div className="space-y-6 text-lg text-white/80 leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {siteConfig.photographer.bio}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
              >
                {siteConfig.content.about.content}
              </motion.p>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
              >
                Based in {siteConfig.photographer.location}, I'm open to working with clients 
                statewide to create something beautiful together.
              </motion.p>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">4+</div>
                <div className="text-sm text-white/60">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">500+</div>
                <div className="text-sm text-white/60">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-400">1000+</div>
                <div className="text-sm text-white/60">Photos Taken</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-500/20 to-secondary-500/20">
              {/* Placeholder for photographer image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 opacity-20" />
              
              {/* Sample images carousel */}
              <div className="absolute inset-4 rounded-xl overflow-hidden">
                {aboutImages.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: index === currentImageIndex ? 1 : 0,
                      scale: index === currentImageIndex ? 1 : 1.1
                    }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
                      <div className="text-center text-white/60">
                        <div className="text-4xl mb-2">📸</div>
                        <div className="text-sm">Professional Photography</div>
                        <div className="text-xs mt-1">Sample Work {index + 1}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Image indicators */}
              {aboutImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {aboutImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? 'bg-white w-6'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-500/20 rounded-full blur-xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary-500/20 rounded-full blur-xl" />
          </motion.div>
        </div>

        {/* Skills/Services */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 lg:mt-32"
        >
          <h3 className="text-2xl md:text-3xl font-light text-white text-center mb-12">
            Photography Services
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {siteConfig.services.filter(service => service.featured).map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h4 className="text-xl font-semibold text-white mb-3">{service.title}</h4>
                <p className="text-white/70">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}