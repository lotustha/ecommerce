import { z } from "zod";

export const SettingsFormSchema = z.object({
  // Branding
  appName: z.string().min(1, "App Name is required"),
  storeLogo: z.string().url().optional().nullable().or(z.literal("")),

  // Localization
  currency: z.string().min(1, "Currency is required"),
  taxRate: z.coerce.number().min(0),

  // Shipping
  shippingCharge: z.coerce.number().min(0).default(150),
  shippingMarkup: z.coerce.number().min(0).default(0),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
  deliveryPartners: z.string().optional(),

  // ✅ LOGISTICS CONFIG (New Fields)
  enableStoreDelivery: z.boolean().default(true),
  enablePathao: z.boolean().default(false),
  pathaoSandbox: z.boolean().default(true),
  pathaoClientId: z.string().optional().nullable(),
  pathaoClientSecret: z.string().optional().nullable(),
  pathaoUsername: z.string().optional().nullable(),
  pathaoPassword: z.string().optional().nullable(),

  // Store Info
  storeName: z.string().min(1, "Store Name is required"),
  storeTaxId: z.string().optional().nullable(),
  storeDescription: z.string().optional().nullable(),
  storeAddress: z.string().optional().nullable(),
  storePhone: z.string().optional().nullable(),
  storeEmail: z.string().email().optional().nullable().or(z.literal("")),

  // Social Links
  socialFacebook: z.string().url().optional().nullable().or(z.literal("")),
  socialInstagram: z.string().url().optional().nullable().or(z.literal("")),
  socialTiktok: z.string().url().optional().nullable().or(z.literal("")),
  socialTwitter: z.string().url().optional().nullable().or(z.literal("")),

  // Payments
  enableCod: z.boolean(),

  enableEsewa: z.boolean(),
  esewaSandbox: z.boolean().default(true), // ✅ Added
  esewaId: z.string().optional().nullable(),
  esewaSecret: z.string().optional().nullable(),

  enableKhalti: z.boolean(),
  khaltiSandbox: z.boolean().default(true), // ✅ Added
  khaltiSecret: z.string().optional().nullable(),

  enableSctPay: z.boolean(),
  sctPayKey: z.string().optional().nullable(),

  // AI & Legal
  aiOpenAiKey: z.string().optional().nullable(),
  aiGeminiKey: z.string().optional().nullable(),
  crawlerApiKey: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
});

export type SettingsFormValues = z.infer<typeof SettingsFormSchema>;
