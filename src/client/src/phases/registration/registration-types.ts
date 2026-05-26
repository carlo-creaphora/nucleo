export type RegistrationFormState = {
  profileName: string;
  profileEmail: string;
  profileRole: string;
  profileArea: string;
  profileCountry: string;
  peopleManaged: string;
  companyName: string;
  sectorCategory: string;
  employeeCount: string;
  yearsInMarket: string;
  operatingCountries: string;
  sellsTo: string;
  revenueModel: string;
  website: string;
  acquisitionChannels: string[];
  averageTicket: string;
  averageSalesCycleDays: string;
  competitor1: string;
  competitor1Web: string;
  competitor2: string;
  competitor2Web: string;
  competitor3: string;
  competitor3Web: string;
  categoryNotes: string;
  documents: string;
};

export type UploadedRegistrationDocument = {
  id: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceUrl?: string;
  extractionStatus?: "EXTRACTED" | "TEXT_PROVIDED" | "UNSUPPORTED" | "EMPTY";
  summary?: string;
  extractedText?: string;
};

export type RegistrationPayload = {
  cycleId: string;
  profileLicense: {
    licenseId: string;
    name: string;
    role: string;
    area: string;
    email: string;
    country: string;
    peopleManaged?: number;
  };
  company: {
    companyId: string;
    name: string;
    sectorCategory: string;
    employeeCount?: number;
    yearsInMarket?: number;
    operatingCountries: string[];
    sellsTo: string;
    revenueModel: string;
    website?: string;
    acquisitionChannels: string[];
  };
  category: {
    averageTicket?: string;
    averageSalesCycleDays?: number;
    competitors: Array<{ name: string; website: string }>;
    notes?: string;
  };
  uploadedDocuments: UploadedRegistrationDocument[];
};
