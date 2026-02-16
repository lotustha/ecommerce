"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import {
  SettingsFormSchema,
  SettingsFormValues,
} from "@/lib/validators/settings-schema";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function getSettings() {
  try {
    await requireAdmin();
    // Singleton pattern: always fetch ID "default"
    const settings = await prisma.systemSetting.findUnique({
      where: { id: "default" },
    });
    return settings;
  } catch (error) {
    return null;
  }
}

export async function updateSettings(data: SettingsFormValues) {
  try {
    await requireAdmin();

    const validated = SettingsFormSchema.safeParse(data);
    if (!validated.success) return { error: "Invalid settings data" };

    await prisma.systemSetting.upsert({
      where: { id: "default" },
      update: validated.data,
      create: {
        id: "default",
        ...validated.data,
      },
    });

    revalidatePath("/"); // Revalidate everything as app name/currency might change globally
    return { success: "Settings updated successfully" };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update settings" };
  }
}
