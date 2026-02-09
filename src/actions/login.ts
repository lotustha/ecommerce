"use server"

import * as z from "zod"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

// Define validation schema directly here for now
const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
})

export async function login(values: z.infer<typeof LoginSchema>) {
    // 1. Validate fields on the server
    const validatedFields = LoginSchema.safeParse(values)

    if (!validatedFields.success) {
        return { error: "Invalid fields!" }
    }

    const { email, password } = validatedFields.data

    // 2. Attempt Sign In
    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard", // Redirect to dashboard after success
        })
    } catch (error) {
        // 3. Handle specific Auth errors
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" }
                default:
                    return { error: "Something went wrong!" }
            }
        }

        // 4. Important: Next.js redirects throw an error, so we must re-throw it
        throw error
    }
}

// New: Social Login Action
export async function socialLogin(provider: "google" | "facebook") {
    await signIn(provider, {
        redirectTo: "/dashboard",
    })
}