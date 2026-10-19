export const CORPORATE_CONFIG = {
  legalEntityName:
    process.env.NEXT_PUBLIC_COMPANY_NAME ||
    "Purely Istanbul Hospitality & Digital Concierge Technologies",
  ukEntityName:
    process.env.NEXT_PUBLIC_UK_COMPANY_NAME || "Purely Istanbul Ltd",
  companyRegNo:
    process.env.NEXT_PUBLIC_COMPANY_REG_NO ||
    "UK Companies House Reg. No. 15849210",
  taxOffice:
    process.env.NEXT_PUBLIC_COMPANY_TAX_OFFICE ||
    "Beyoğlu Tax Directorate (Beyoğlu Vergi Dairesi)",
  taxId: process.env.NEXT_PUBLIC_COMPANY_TAX_ID || "7342091845",
  mersisNo:
    process.env.NEXT_PUBLIC_COMPANY_MERSIS_NO || "0734209184500001",
  registeredAddress:
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
    "Tomtom Mah. İstiklal Cad. Beyoğlu, 34433 Istanbul, Türkiye",
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
  etbisStatusLabel:
    "Registered E-Commerce Platform — Turkish Ministry of Trade (ETBİS)",
  etbisVerifyUrl:
    process.env.NEXT_PUBLIC_ETBIS_VERIFY_URL ||
    "https://www.eticaret.gov.tr",
} as const;
