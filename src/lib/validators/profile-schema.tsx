import { z } from "zod"

// Reuse Address logic
export const AddressSchema = z.object({
    id: z.string().optional(),
    province: z.string().min(1, "Province is required"),
    district: z.string().min(1, "District is required"),
    city: z.string().min(1, "City is required"),
    ward: z.coerce.number().min(1, "Ward is required"),
    street: z.string().min(1, "Street is required"),
    postalCode: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    isDefault: z.boolean().default(false),
})

export const ProfileFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    // ✅ Image: Allow URL or Base64 (Data URI)
    image: z.string()
        .refine(val => !val || val.startsWith('http') || val.startsWith('data:image'), {
            message: "Must be a valid URL or image file"
        })
        .optional()
        .nullable(),
    // Password change (Optional)
    password: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
    addresses: z.array(AddressSchema).optional().default([]),
}).refine((data) => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export type ProfileFormValues = z.infer<typeof ProfileFormSchema>