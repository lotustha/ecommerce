import NextAuth from "next-auth"
import authConfig from "@/auth.config"

// Use the edge-compatible config we created earlier
export const { auth: middleware } = NextAuth(authConfig)

// Don't invoke Middleware on static files or API routes (unless specific protections are added)
export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}