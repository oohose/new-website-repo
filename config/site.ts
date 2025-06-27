export const siteConfig = {
  name: "Peyton's Photography",
  description: "Professional photography services capturing life's most precious moments with artistic vision and technical excellence.",
  
  photographer: {
    name: "Peyton Snipes",
    email: "peysphotos6@gmail.com",
    phone: "+1 (832) 910-6932",
    location: "Houston, TX",
    bio: ""
  },

  content: {
    hero: {
      title: "Welcome.",
      subtitle: "",
      cta: "View My Work"
    },
    about: {
      content: "I first picked up a camera when I was 16 years old. I was instantly hooked. I see photography as a way to capture feelings and not just moments. My goal is to create images that make you feel something. I want to tell a story with every photo I take, whether it's a portrait, an event, or an automotive shoot. My passion is to create art that resonates with you and captures your unique vision, energy and style.",
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
      "portrait photography",
      "professional photography",
      "Texas photographer",
      "event photography",
      "portrait photographer",
      "automotive photography",
    ]
  },

  business: {
  }
}