import { z } from "zod";

export const SettingsFormSchema = z.object({
  appName: z.string().min(1, "App Name is required"),
  // ✅ Added Logo
  appLogo: z.string().url().optional().nullable().or(z.literal("")),

  currency: z.string().min(1, "Currency is required"),
  taxRate: z.coerce.number().min(0),

  // ✅ Added Shipping Logic
  shippingCharge: z.coerce.number().min(0).default(150),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),

  storeName: z.string().min(1, "Store Name is required"),
  storeDescription: z.string().optional().nullable(),
  storeAddress: z.string().optional().nullable(),
  storePhone: z.string().optional().nullable(),
  storeEmail: z.string().email().optional().nullable().or(z.literal("")),

  // ✅ Added Social Links
  socialFacebook: z.string().url().optional().nullable().or(z.literal("")),
  socialInstagram: z.string().url().optional().nullable().or(z.literal("")),
  socialTiktok: z.string().url().optional().nullable().or(z.literal("")),

  esewaId: z.string().optional().nullable(),
  esewaSecret: z.string().optional().nullable(),
  khaltiSecret: z.string().optional().nullable(),
  sctPayKey: z.string().optional().nullable(), // Placeholder if you add SCT later

  enableCod: z.boolean(),
  enableEsewa: z.boolean(),
  enableKhalti: z.boolean(),

  privacyPolicy: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
});

export type SettingsFormValues = z.infer<typeof SettingsFormSchema>;
