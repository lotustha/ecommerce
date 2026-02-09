import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

// Simple schema for login validation
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export default {
    providers: [
        Credentials({
            // 1. Authorize function is where we verify credentials
            // We will perform the actual DB check in auth.ts later to avoid Edge errors here
            async authorize(credentials) {
                const validatedFields = LoginSchema.safeParse(credentials)

                if (validatedFields.success) {
                    // We return null here because we can't use Prisma inside this edge-compatible file.
                    // The real logic happens in auth.ts which extends this config.
                    return null
                }
                return null
            },
        }),
    ],
    pages: {
        signIn: "/login", // Updated: Route groups (auth) are excluded from the URL path
    },
    callbacks: {
        // 2. Middleware logic to protect routes
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")

            // Redirect unauthenticated users away from admin dashboard
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect to login
            }

            // Allow access to all other pages by default
            return true
        },
    },
} satisfies NextAuthConfig