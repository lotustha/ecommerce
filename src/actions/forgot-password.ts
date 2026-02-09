"use server";

import * as z from "zod";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from "crypto";

const ResetSchema = z.object({
  email: z.email("Invalid email address"),
});

export async function resetPassword(values: z.infer<typeof ResetSchema>) {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email!" };
  }

  const { email } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  // For security, even if the user doesn't exist, we return a success message
  // so attackers can't fish for valid emails.
  if (!existingUser) {
    return { success: "If an account exists, a reset email has been sent." };
  }

  // 1. Generate a secure token
  const token = randomUUID();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour expiry

  // 2. Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // 3. Save new token to database
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  // 4. Send Email (Mock Implementation)
  // In a real app, you would use Resend or SendGrid here.
  const resetLink = `http://localhost:3000/new-password?token=${token}`;
  console.log("📧 MOCK EMAIL SENT:");
  console.log(`To: ${email}`);
  console.log(`Link: ${resetLink}`);

  return { success: "If an account exists, a reset email has been sent." };
}
