import NextAuth from "next-auth"

const handler = NextAuth({
  providers: [
    // Add your providers here when ready
    // For now, we'll keep it minimal
  ],
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async jwt({ token, user }) {
      return token
    },
  },
})

export { handler as GET, handler as POST }