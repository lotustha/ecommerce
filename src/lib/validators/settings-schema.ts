import { z } from "zod"

export const SettingsFormSchema = z.object({
  appName: z.string().min(1, "App name is required"),
  storeName: z.string().min(1, "Store name is required"),
  storeSubtitle: z.string().optional().nullable(),
  storeEmail: z.string().email().optional().or(z.literal("")),
  storePhone: z.string().optional().nullable(),
  storeAddress: z.string().optional().nullable(),
  storeTaxId: z.string().optional().nullable(),
  storeLogo: z.string().optional().nullable(),
  currency: z.string().default("NPR"),
  taxRate: z.coerce.number().min(0).max(100).default(0),

  // Socials
  socialFacebook: z.string().url().optional().or(z.literal("")),
  socialInstagram: z.string().url().optional().or(z.literal("")),
  socialTwitter: z.string().url().optional().or(z.literal("")),
  socialTiktok: z.string().url().optional().or(z.literal("")),

  // Logistics
  shippingCharge: z.coerce.number().min(0).default(150),
  shippingMarkup: z.coerce.number().min(0).default(0),
  freeShippingThreshold: z.coerce.number().optional().nullable(),
  enableStoreDelivery: z.boolean().default(true),

  enablePathao: z.boolean().default(false),
  pathaoSandbox: z.boolean().default(true),
  pathaoClientId: z.string().optional().nullable(),
  pathaoClientSecret: z.string().optional().nullable(),
  pathaoUsername: z.string().optional().nullable(),
  pathaoPassword: z.string().optional().nullable(),

  enableNcm: z.boolean().default(false),
  ncmSandbox: z.boolean().default(true),
  ncmToken: z.string().optional().nullable(),
  ncmOriginBranch: z.string().optional().nullable(),

  // Payments
  enableCod: z.boolean().default(true),
  enableEsewa: z.boolean().default(false),
  esewaSandbox: z.boolean().default(true),
  esewaId: z.string().optional().nullable(),
  esewaSecret: z.string().optional().nullable(),

  enableKhalti: z.boolean().default(false),
  khaltiSandbox: z.boolean().default(true),
  khaltiSecret: z.string().optional().nullable(),

  // AI & Legal
  aiGeminiKey: z.string().optional().nullable(),
  aiOpenAiKey: z.string().optional().nullable(),
  crawlerApiKey: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),

  // ✅ Storefront CMS
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroImage: z.string().optional().nullable(),

  // ✅ Multi-Provider Email Config
  mailProvider: z.enum(["SMTP", "RESEND"]).default("SMTP"),
  storeEmailFrom: z.string().optional().nullable(),
  smtpHost: z.string().optional().nullable(),
  smtpPort: z.coerce.number().optional().nullable(),
  smtpUser: z.string().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  resendApiKey: z.string().optional().nullable(),
})

export type SettingsFormValues = z.infer<typeof SettingsFormSchema>