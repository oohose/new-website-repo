/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the experimental appDir flag - it's stable in Next.js 14
  images: {
    domains: [
      'res.cloudinary.com',
      'cloudinary.com'
    ],
  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  }
}

module.exports = nextConfig