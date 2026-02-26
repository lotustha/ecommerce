"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendWelcomeEmail } from "@/lib/mail" // 
// Updated Schema: Includes Phone Number
const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function register(values: z.infer<typeof RegisterSchema>) {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, phone } = validatedFields.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Email already in use!" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        phone, // Save phone number to User model
        password: hashedPassword,
        role: "USER",
      },
    });
    // ✅ Send Welcome Email
    try {
      await sendWelcomeEmail(email, name);
    } catch (e) {
      console.error("Non-fatal: Failed to send welcome email", e);
    }
    return { success: "Account created! Please login." };
  } catch (error) {
    console.error("Registration Error:", error);
    return { error: "Something went wrong!" };
  }
}
