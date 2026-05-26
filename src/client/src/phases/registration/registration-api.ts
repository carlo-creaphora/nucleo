import { type RegistrationRecord } from "../../app-state.js";
import {
  type RegistrationPayload,
  type UploadedRegistrationDocument,
} from "./registration-types.js";

export async function saveRegistration(payload: RegistrationPayload) {
  const response = await fetch("/api/registration", {
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(error?.message ?? "No se pudo guardar el registro.");
  }

  return (await response.json()) as {
    registration: RegistrationRecord;
  };
}

export async function uploadRegistrationDocuments({
  cycleId,
  files,
}: {
  cycleId: string;
  files: File[];
}) {
  const documents = await Promise.all(
    files.map(async (file) => ({
      dataBase64: await fileToBase64(file),
      mimeType: file.type || undefined,
      name: file.name,
      sizeBytes: file.size,
    })),
  );
  const response = await fetch("/api/registration/documents", {
    body: JSON.stringify({ cycleId, documents }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  const data = (await response.json().catch(() => null)) as {
    documents?: UploadedRegistrationDocument[];
    message?: string;
  } | null;

  if (!response.ok || !data?.documents) {
    throw new Error(data?.message ?? "No se pudieron cargar documentos.");
  }

  return data.documents;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",").at(1) ?? "" : result);
    };
    reader.readAsDataURL(file);
  });
}
