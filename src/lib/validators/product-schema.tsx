import { z } from "zod";

export const ProductFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional().nullable(),
  images: z.array(z.string()).refine(
    (items) =>
      items.every(
        (item) =>
          item.startsWith("http") ||
          item.startsWith("data:image") ||
          item.startsWith("/") || // Allow relative paths
          item.startsWith("blob:"), // Allow local blob previews
      ),
    {
      message: "Must be valid image URLs, relative paths, or uploaded files",
    },
  ),
  isFeatured: z.boolean().default(false),
  isArchived: z.boolean().default(false),

  // SEO Fields
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),

  // Cross Sells
  crossSells: z.array(z.string()).optional().default([]),

  // ✅ FIX: Added options to schema so it doesn't get stripped out
  options: z.string().optional().nullable(),

  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name required (e.g. Red / XL)"),
        sku: z.string().min(1, "SKU required"),
        price: z.coerce.number().min(0, "Price must be positive"),
        stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
        colorCode: z.string().optional().nullable(),
        image: z.string().optional().nullable(),
      }),
    )
    .optional(),

  specs: z
    .array(
      z.object({
        name: z.string().min(1, "Attribute name required (e.g. Material)"),
        value: z.string().min(1, "Value required (e.g. Cotton)"),
      }),
    )
    .optional(),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;
