import { z } from "zod";

export const SettingsFormSchema = z.object({
  // Branding
  appName: z.string().min(1, "App Name is required"),
  storeLogo: z.string().optional().nullable().or(z.literal("")),

  // Localization
  currency: z.string().min(1, "Currency is required"),
  taxRate: z.coerce.number().min(0),

  // Shipping
  shippingCharge: z.coerce.number().min(0).default(150),
  shippingMarkup: z.coerce.number().min(0).default(0),
  freeShippingThreshold: z.coerce.number().min(0).optional().nullable(),
  deliveryPartners: z.string().optional().nullable(),

  // LOGISTICS CONFIG
  enableStoreDelivery: z.boolean().default(true),
  enablePathao: z.boolean().default(false),
  pathaoSandbox: z.boolean().default(true),
  pathaoClientId: z.string().optional().nullable(),
  pathaoClientSecret: z.string().optional().nullable(),
  pathaoUsername: z.string().optional().nullable(),
  pathaoPassword: z.string().optional().nullable(),

  // NCM LOGISTICS
  enableNcm: z.boolean().default(false),
  ncmSandbox: z.boolean().default(true),
  ncmToken: z.string().optional().nullable(),
  ncmOriginBranch: z.string().optional().nullable(),

  // Store Info
  storeName: z.string().min(1, "Store Name is required"),
  storeTaxId: z.string().optional().nullable(),
  storeSubtitle: z.string().optional().nullable(), // ✅ Matches Prisma
  storeAddress: z.string().optional().nullable(),
  storePhone: z.string().optional().nullable(),
  storeEmail: z
    .string()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),

  // Social Links - Removed strict .url() to prevent silent validation failures
  socialFacebook: z.string().optional().nullable(),
  socialInstagram: z.string().optional().nullable(),
  socialTiktok: z.string().optional().nullable(),
  socialTwitter: z.string().optional().nullable(),

  // Payments
  enableCod: z.boolean().default(true),

  enableEsewa: z.boolean().default(false),
  esewaSandbox: z.boolean().default(true),
  esewaId: z.string().optional().nullable(),
  esewaSecret: z.string().optional().nullable(),

  enableKhalti: z.boolean().default(false),
  khaltiSandbox: z.boolean().default(true),
  khaltiSecret: z.string().optional().nullable(),

  enableSctPay: z.boolean().default(false),
  sctPayKey: z.string().optional().nullable(),

  // AI & Legal
  aiOpenAiKey: z.string().optional().nullable(),
  aiGeminiKey: z.string().optional().nullable(),
  crawlerApiKey: z.string().optional().nullable(),
  privacyPolicy: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
});

export type SettingsFormValues = z.infer<typeof SettingsFormSchema>;
