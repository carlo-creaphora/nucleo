import {
  type RegistrationFormState,
  type RegistrationPayload,
  type UploadedRegistrationDocument,
} from "./registration-types.js";

export function buildRegistrationPayload(
  cycleId: string,
  form: RegistrationFormState,
  uploadedDocuments: UploadedRegistrationDocument[] = [],
): RegistrationPayload {
  const documents = form.documents.trim()
    ? [
        {
          id: `doc_text_${Date.now()}`,
          name: "Notas internas",
          extractionStatus: "TEXT_PROVIDED" as const,
          summary: "Contexto interno cargado desde Registro.",
          extractedText: form.documents.trim(),
        },
      ]
    : [];

  return {
    cycleId,
    profileLicense: {
      licenseId: `license_${slug(form.profileEmail || form.profileName || cycleId)}`,
      name: form.profileName.trim(),
      role: form.profileRole.trim(),
      area: form.profileArea.trim(),
      email: form.profileEmail.trim(),
      country: form.profileCountry.trim(),
      peopleManaged: numberOrUndefined(form.peopleManaged),
    },
    company: {
      companyId: `company_${slug(form.companyName || cycleId)}`,
      name: form.companyName.trim(),
      sectorCategory: form.sectorCategory.trim(),
      employeeCount: numberOrUndefined(form.employeeCount),
      yearsInMarket: numberOrUndefined(form.yearsInMarket),
      operatingCountries: list(form.operatingCountries),
      sellsTo: form.sellsTo.trim(),
      revenueModel: form.revenueModel.trim(),
      website: form.website.trim() || undefined,
      acquisitionChannels: form.acquisitionChannels,
    },
    category: {
      averageTicket: form.averageTicket.trim() || undefined,
      averageSalesCycleDays: numberOrUndefined(form.averageSalesCycleDays),
      competitors: [
        { name: form.competitor1, website: form.competitor1Web },
        { name: form.competitor2, website: form.competitor2Web },
        { name: form.competitor3, website: form.competitor3Web },
      ]
        .map((competitor) => ({
          name: competitor.name.trim(),
          website: competitor.website.trim(),
        }))
        .filter((competitor) => competitor.name && competitor.website),
      notes: form.categoryNotes.trim() || undefined,
    },
    uploadedDocuments: [...uploadedDocuments, ...documents],
  };
}

function list(value: string) {
  return value
    .split(/,| y /)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() ? parsed : undefined;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
