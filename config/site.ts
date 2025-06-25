export const siteConfig = {
  name: "Peyton's Photography",
  description: "Professional photography services capturing life's most precious moments with artistic vision and technical excellence.",
  
  photographer: {
    name: "Peyton Snipes",
    email: "peysphotos6@gmail.com",
    phone: "+1 (832) 910-6932",
    location: "Houston, TX",
    bio: "I'm a passionate photographer who believes that every moment has a story to tell. With an eye for detail and a love for capturing authentic emotions, I specialize in creating timeless images that you'll treasure forever."
  },

  content: {
    hero: {
      title: "Capturing Life's Beautiful Moments",
      subtitle: "Professional photography with a personal touch",
      cta: "View My Work"
    },
    about: {
      content: "Photography is more than just taking pictures—it's about freezing moments in time, preserving memories, and telling stories that matter. My approach combines technical expertise with creative vision to deliver images that truly reflect who you are and what matters most to you."
    }
  },

  theme: {
    darkMode: true,
    gradients: {
      hero: "bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900",
      primary: "bg-gradient-to-r from-blue-500 to-purple-600",
      secondary: "bg-gradient-to-r from-purple-500 to-pink-600"
    },
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      secondary: {
        50: '#fdf4ff',
        100: '#fae8ff',
        200: '#f5d0fe',
        300: '#f0abfc',
        400: '#e879f9',
        500: '#d946ef',
        600: '#c026d3',
        700: '#a21caf',
        800: '#86198f',
        900: '#701a75',
      }
    }
  },

  socialLinks: {
    instagram: "https://instagram.com/pey.s6",
    facebook: "",
    twitter: "",
    linkedin: "",
    youtube: ""
  },

  navigation: {
    main: [
      { name: "Home", href: "#home" },
      { name: "Portfolio", href: "#portfolio" },
      { name: "About", href: "#about" },
      { name: "Contact", href: "#contact" }
    ],
    footer: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Contact", href: "#contact" }
    ]
  },

  footer: {
    copyright: `© ${new Date().getFullYear()} Peyton's Photography. All rights reserved.`
  },

  seo: {
    keywords: [
      "photography",
      "photographer",
      "Houston photographer",
      "wedding photography",
      "portrait photography",
      "professional photography",
      "Texas photographer",
      "event photography",
      "family photography"
    ]
  },

  business: {
    hours: {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "10:00 AM - 4:00 PM",
      sunday: "By Appointment"
    }
  }
}