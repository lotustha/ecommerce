import { z } from "zod";

export const AddressSchema = z.object({
  id: z.string().optional(),
  province: z.string().min(1, "Province is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "Municipality is required"),
  ward: z.coerce.number().min(1, "Ward is required"),
  street: z.string().min(1, "Street is required"),
  postalCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const CustomerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  image: z
    .string()
    .refine(
      (val) => !val || val.startsWith("http") || val.startsWith("data:image"),
      {
        message: "Must be a valid URL or image file",
      },
    )
    .optional()
    .nullable(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  addresses: z.array(AddressSchema).optional().default([]),
});

export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;
