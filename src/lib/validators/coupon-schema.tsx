import { z } from "zod";

export const CouponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(1, "Value must be greater than 0"),
  maxDiscount: z.coerce.number().optional().nullable(),
  minOrder: z.coerce.number().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CouponFormValues = z.infer<typeof CouponFormSchema>;
