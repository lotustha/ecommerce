import { z } from "zod";

export const StaffFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["ADMIN", "STAFF", "RIDER"], {
    error: () => ({ message: "Please select a valid role" }),
  }),
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
  // ✅ Fixed: Cleaner optional password validation
  password: z
    .string()
    .refine((val) => !val || val.length >= 6, {
      message: "Password must be at least 6 characters",
    })
    .optional()
    .nullable(),
});

export type StaffFormValues = z.infer<typeof StaffFormSchema>;
