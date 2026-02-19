import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";

// Cache the settings globally. It will be invalidated when settings are updated in the admin panel.
export const getGlobalSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.systemSetting.findUnique({
        where: { id: "default" },
      });
      return settings;
    } catch (error) {
      console.error("Failed to load global settings", error);
      return null;
    }
  },
  ["global-system-settings"],
  { tags: ["settings"], revalidate: 3600 }, // Also revalidates every hour automatically
);
