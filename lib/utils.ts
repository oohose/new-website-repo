// Simplified utils file without clsx dependency

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export const siteConfig = {
  name: process.env.SITE_NAME || "Peyton's Photography",
  photographer: {
    name: process.env.PHOTOGRAPHER_NAME || "Peyton Snipes",
    email: process.env.PHOTOGRAPHER_EMAIL || "peysphotos6@gmail.com",
    phone: process.env.PHOTOGRAPHER_PHONE || "+1 (832) 910-6932",
    location: process.env.PHOTOGRAPHER_LOCATION || "Houston, TX"
  },
  social: {
    instagram: process.env.INSTAGRAM_URL || "https://instagram.com/pey.s6",
    facebook: process.env.FACEBOOK_URL || "",
    twitter: process.env.TWITTER_URL || "",
    website: process.env.WEBSITE_URL || ""
  }
}