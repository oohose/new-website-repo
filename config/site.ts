// config/site.ts
export const siteConfig = {
  // Basic Site Information
  name: process.env.SITE_NAME || "Peyton's Photography",
  title: "Professional Photography Services",
  description: "Professional photography services by Peyton Snipes. Specializing in weddings, portraits, and events in Houston, TX.",
  url: process.env.NEXTAUTH_URL || "https://yourdomain.com",
  
  // Photographer Information
  photographer: {
    name: process.env.PHOTOGRAPHER_NAME || "Peyton Snipes",
    email: process.env.PHOTOGRAPHER_EMAIL || "peysphotos6@gmail.com",
    phone: process.env.PHOTOGRAPHER_PHONE || "+1 (832) 910-6932",
    location: process.env.PHOTOGRAPHER_LOCATION || "Houston, TX",
    bio: "Professional photographer specializing in capturing life's most precious moments with an artistic eye and personal touch.",
    avatar: "/images/peyton-avatar.jpg", // Path to your profile image
  },

  // Navigation Menu
  navigation: {
    main: [
      { name: "Home", href: "#home" },
      { name: "Portfolio", href: "#portfolio" },
      { name: "About", href: "#about" },
      { name: "Contact", href: "#contact" },
    ],
    footer: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ]
  },

  // Social Media Links
  socialLinks: {
    instagram: process.env.INSTAGRAM_URL || "https://instagram.com/pey.s6",
    facebook: process.env.FACEBOOK_URL || "",
    twitter: process.env.TWITTER_URL || "",
    website: process.env.WEBSITE_URL || "",
    // Add more as needed
  },

  // Contact Form Configuration
  contact: {
    eventTypes: [
      { value: "", label: "Select event type" },
      { value: "wedding", label: "Wedding" },
      { value: "portrait", label: "Portrait Session" },
      { value: "corporate", label: "Corporate Event" },
      { value: "family", label: "Family Photos" },
      { value: "other", label: "Other" },
    ],
    formMessages: {
      success: "Message sent successfully! I'll get back to you soon.",
      error: "Failed to send message. Please try again.",
      sending: "Sending...",
      send: "Send Message",
    }
  },

  // SEO & Meta Tags
  seo: {
    keywords: ['photography', 'wedding', 'portrait', 'event', 'houston', 'texas'],
    ogImage: "/images/og-image.jpg", // Open Graph image for social sharing
    twitterCard: "summary_large_image",
    twitterHandle: "@your_twitter_handle", // Update with actual Twitter handle
    favicon: "/favicon.ico",
  },

  // Services/Specialties
  services: [
    {
      title: "Wedding Photography",
      description: "Capturing your special day with timeless elegance",
      icon: "💍",
      featured: true
    },
    {
      title: "Portrait Sessions", 
      description: "Professional headshots and personal portraits",
      icon: "📸",
      featured: true
    },
    {
      title: "Event Photography",
      description: "Corporate events, parties, and special occasions",
      icon: "🎉",
      featured: true
    },
    {
      title: "Family Photos",
      description: "Precious family moments to treasure forever",
      icon: "👨‍👩‍👧‍👦",
      featured: false
    },
  ],

  // Content Sections
  content: {
    hero: {
      title: "Capturing Life's Most Beautiful Moments",
      subtitle: "Professional photography that tells your unique story",
      cta: "View Portfolio",
      ctaSecondary: "Get in Touch"
    },
    about: {
      title: "About Peyton",
      content: "With a passion for capturing authentic moments and a keen eye for detail, I specialize in creating timeless photographs that tell your unique story. From intimate portraits to grand celebrations, every image is crafted with care and artistic vision."
    },
    contact: {
      title: "Let's Create Something Beautiful",
      subtitle: "Ready to capture your special moments? Get in touch and let's discuss your vision.",
      infoTitle: "Get in Touch",
      socialTitle: "Follow My Work"
    }
  },

  // Theme & Styling
  theme: {
    primaryColor: "primary", // Using your existing primary color classes
    darkMode: true,
    gradients: {
      hero: "bg-hero-gradient",
      dark: "bg-dark-gradient",
      contact: "bg-gradient-to-b from-black to-gray-900"
    }
  },

  // Footer Information
  footer: {
    copyright: `© ${new Date().getFullYear()} ${process.env.PHOTOGRAPHER_NAME || "Peyton Snipes"}. All rights reserved.`,
    disclaimer: "All photographs are the intellectual property of Peyton Snipes Photography.",
  }
}

// Export individual sections for easy importing
export const { 
  name, 
  title, 
  description, 
  photographer, 
  socialLinks, 
  contact,
  navigation,
  seo,
  services,
  content,
  theme,
  footer
} = siteConfig

// Legacy compatibility - keep the old structure for existing imports
export const social = socialLinks