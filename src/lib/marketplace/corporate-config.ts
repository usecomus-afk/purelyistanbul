export const CORPORATE_CONFIG = {
  legalEntityName:
    process.env.NEXT_PUBLIC_COMPANY_NAME ||
    "Purely Istanbul",
  companyRegNo:
    process.env.NEXT_PUBLIC_COMPANY_REG_NO ||
    "Purely Istanbul Ltd (Pre-registration Sandbox Staging / Company No: Pending Launch)",
  registeredAddress:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "Beyoğlu, Istanbul, Türkiye",
  contactEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "hi@usecomus.com",
  contactPhone: process.env.NEXT_PUBLIC_COMPANY_PHONE || "0850 308 59 06",
  contactPhoneHref:
    process.env.NEXT_PUBLIC_COMPANY_PHONE_HREF || "tel:+908503085906",
  whatsappHref:
    process.env.NEXT_PUBLIC_COMPANY_WHATSAPP_HREF ||
    "https://wa.me/908503085906",
  operatingHours:
    "7 days a week, 24/7 Concierge & Guest Support (Istanbul GMT+3)",
  tursabDisclosure:
    "All Regulated Travel & Tour Packages Fulfilled by Licensed TÜRSAB Group A Partner Agencies & D2-Certified Transport Operators",
} as const;
