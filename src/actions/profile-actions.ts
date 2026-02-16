"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import { ProfileFormSchema, ProfileFormValues } from "@/lib/validators/profile-schema"
import bcrypt from "bcryptjs"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

// Reuse the image saver helper
async function saveImageToDisk(base64Data: string): Promise<string> {
    if (!base64Data || !base64Data.startsWith('data:image')) return base64Data;

    try {
        const matches = base64Data.match(/^data:image\/([a-z]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) throw new Error('Invalid image data');
        const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads'); // Generic uploads folder
        try { await fs.access(uploadDir); } catch { await fs.mkdir(uploadDir, { recursive: true }); }
        const filename = `${crypto.randomUUID()}.${extension}`;
        const filepath = path.join(uploadDir, filename);
        await fs.writeFile(filepath, buffer);
        return `/uploads/${filename}`;
    } catch (error) {
        console.error("Image Save Error:", error);
        return ""; // Return empty on error to avoid crashing
    }
}

export async function updateProfile(data: ProfileFormValues) {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
        return { error: "You must be logged in." }
    }

    const validated = ProfileFormSchema.safeParse(data)
    if (!validated.success) {
        return { error: "Invalid form data" }
    }

    const { password, confirmPassword, addresses, image, ...fields } = validated.data

    try {
        // 1. Handle Image
        let imageUrl = image;
        if (image && image.startsWith("data:image")) {
            imageUrl = await saveImageToDisk(image);
        }

        const userData: any = {
            ...fields,
            image: imageUrl
        }

        // 2. Handle Password Change
        if (password) {
            if (password.length < 6) return { error: "Password must be at least 6 characters" }
            userData.password = await bcrypt.hash(password, 10)
        }

        // 3. Execute Transaction
        await prisma.$transaction(async (tx) => {
            // Update User
            await tx.user.update({
                where: { id: userId },
                data: userData
            })

            // Update Addresses (Delete all and recreate is safest for full sync)
            await tx.address.deleteMany({ where: { userId } })

            if (addresses && addresses.length > 0) {
                await tx.address.createMany({
                    data: addresses.map(addr => ({
                        userId,
                        province: addr.province,
                        district: addr.district,
                        city: addr.city,
                        ward: addr.ward,
                        street: addr.street,
                        postalCode: addr.postalCode,
                        phone: addr.phone,
                        isDefault: addr.isDefault
                    }))
                })
            }
        })

        revalidatePath("/profile")
        return { success: "Profile updated successfully" }

    } catch (error) {
        console.error("Profile Update Error:", error)
        return { error: "Failed to update profile" }
    }
}