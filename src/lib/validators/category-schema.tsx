import { z } from "zod";

export const CategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
  parentId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;
