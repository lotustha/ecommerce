"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const NewPasswordSchema = z.object({
  password: z.string().min(6, "Minimum 6 characters required"),
  token: z.string().nullable(),
});

export async function newPassword(values: z.infer<typeof NewPasswordSchema>) {
  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password, token } = validatedFields.data;

  if (!token) {
    return { error: "Missing token!" };
  }

  // 1. Check if token exists in DB
  const existingToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return { error: "Invalid token!" };
  }

  // 2. Check if token has expired
  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  // 3. Find user
  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.identifier },
  });

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  // 4. Hash new password & Update User
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  // 5. Delete the token (single use)
  // Using the composite unique key from schema: @@unique([identifier, token])
  await prisma.verificationToken.delete({
    where: {
      identifier_token: {
        identifier: existingToken.identifier,
        token: existingToken.token,
      },
    },
  });

  return { success: "Password updated!" };
}
