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
  images: z
    .array(z.string())
    .refine(
      (items) =>
        items.every(
          (item) => item.startsWith("http") || item.startsWith("data:image"),
        ),
      {
        message: "Must be valid image URLs or uploaded files",
      },
    ),
  isFeatured: z.boolean().default(false),
  isArchived: z.boolean().default(false),

  // ✅ Variants: Purchasable items (Specific Price/Stock/SKU)
  // If price is not set in UI, frontend should default it to base price before submitting
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name required (e.g. Red / XL)"),
        sku: z.string().min(1, "SKU required"),
        price: z.coerce.number().min(0, "Price must be positive"),
        stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
      }),
    )
    .optional(),

  // ✅ Specifications: Informational details (Comparison/Metadata)
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
