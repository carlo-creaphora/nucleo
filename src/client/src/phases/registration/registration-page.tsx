import { useState, type ChangeEvent } from "react";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { useAppState } from "../../app-state.js";
import { Button } from "../../components/ui/button.js";
import { Card, SectionLabel } from "../../components/ui/card.js";
import { Chip } from "../../components/ui/chip.js";
import { Field, TextArea, TextInput } from "../../components/ui/form-field.js";
import {
  saveRegistration,
  uploadRegistrationDocuments,
} from "./registration-api.js";
import {
  acquisitionChannelOptions,
  demoRegistrationForm,
} from "./registration-demo.js";
import {
  type RegistrationFormState,
  type UploadedRegistrationDocument,
} from "./registration-types.js";
import { buildRegistrationPayload } from "./registration-utils.js";

export function RegistrationPage() {
  const {
    cycleId,
    registration,
    setActivePhaseId,
    setRegistration,
    setRegistrationId,
  } =
    useAppState();
  const [form, setForm] =
    useState<RegistrationFormState>(demoRegistrationForm);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedRegistrationDocument[]
  >([]);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const updateField =
    (field: keyof RegistrationFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const toggleChannel = (channel: string) => {
    setForm((current) => ({
      ...current,
      acquisitionChannels: current.acquisitionChannels.includes(channel)
        ? current.acquisitionChannels.filter((item) => item !== channel)
        : [...current.acquisitionChannels, channel],
    }));
  };

  const submit = async () => {
    setStatus("saving");
    setError(null);

    try {
      const payload = buildRegistrationPayload(cycleId, form, uploadedDocuments);
      const result = await saveRegistration(payload);
      const registrationWithContext = {
        ...result.registration,
        output: result.registration.output ?? {
          contextForDiagnosis: {
            category: payload.category,
            company: payload.company,
            profileLicense: payload.profileLicense,
            uploadedDocuments: payload.uploadedDocuments,
          },
          readiness: {
            blockingIssues: [],
            isReadyForDiagnosis: true,
            warnings: [],
          },
        },
      };
      setRegistration(registrationWithContext);
      setRegistrationId(registrationWithContext.id);
      setStatus("saved");
      setActivePhaseId("diagnosis");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo guardar el registro.",
      );
      setStatus("error");
    }
  };

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setStatus("uploading");
    setError(null);
    try {
      const documents = await uploadRegistrationDocuments({ cycleId, files });
      setUploadedDocuments((current) => [...current, ...documents]);
      setStatus("idle");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudieron cargar documentos.",
      );
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-8 py-8 xl:px-12">
      <section className="rounded-[28px] border border-border bg-surface px-10 py-9 shadow-workspace">
        <SectionLabel>Contexto base</SectionLabel>
        <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-normal">
              Registro real de perfil, empresa y categoría.
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
              Esta información queda como contexto invisible para diagnóstico,
              señales e ideación. No es una encuesta decorativa: define desde
              dónde razona Núcleo.
            </p>
          </div>
          <Button disabled={status === "saving" || status === "uploading"} onClick={submit}>
            {status === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Guardar y diagnosticar
          </Button>
        </div>
      </section>

      {(status === "saved" || registration || error) && (
        <div className="rounded-[18px] border border-border bg-white px-5 py-4 shadow-sm">
          {error ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <CheckCircle2 className="h-4 w-4" />
              Registro guardado. El contexto ya está disponible para
              Diagnóstico.
            </p>
          )}
        </div>
      )}

      <Card className="p-7">
        <SectionLabel>Perfil del usuario</SectionLabel>
        <h2 className="mt-3 text-3xl font-extrabold">
          Quién usará esta licencia
        </h2>
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          <Field label="Nombre">
            <TextInput value={form.profileName} onChange={updateField("profileName")} />
          </Field>
          <Field label="Email">
            <TextInput
              type="email"
              value={form.profileEmail}
              onChange={updateField("profileEmail")}
            />
          </Field>
          <Field label="Rol / cargo">
            <TextInput value={form.profileRole} onChange={updateField("profileRole")} />
          </Field>
          <Field label="Área">
            <TextInput value={form.profileArea} onChange={updateField("profileArea")} />
          </Field>
          <Field label="Personas a cargo">
            <TextInput
              min={0}
              type="number"
              value={form.peopleManaged}
              onChange={updateField("peopleManaged")}
            />
          </Field>
          <Field label="País / ciudad">
            <TextInput
              value={form.profileCountry}
              onChange={updateField("profileCountry")}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-7">
        <SectionLabel>Perfil de empresa</SectionLabel>
        <h2 className="mt-3 text-3xl font-extrabold">
          Contexto base del negocio
        </h2>
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          <Field label="Nombre de empresa">
            <TextInput value={form.companyName} onChange={updateField("companyName")} />
          </Field>
          <Field label="Sector / categoría">
            <TextInput
              value={form.sectorCategory}
              onChange={updateField("sectorCategory")}
            />
          </Field>
          <Field label="Número de empleados">
            <TextInput
              min={1}
              type="number"
              value={form.employeeCount}
              onChange={updateField("employeeCount")}
            />
          </Field>
          <Field label="Años en el mercado">
            <TextInput
              min={0}
              type="number"
              value={form.yearsInMarket}
              onChange={updateField("yearsInMarket")}
            />
          </Field>
          <Field label="Dónde opera">
            <TextInput
              value={form.operatingCountries}
              onChange={updateField("operatingCountries")}
            />
          </Field>
          <Field label="Web">
            <TextInput
              type="url"
              value={form.website}
              onChange={updateField("website")}
            />
          </Field>
          <Field className="xl:col-span-2" label="A quién le vende">
            <TextInput value={form.sellsTo} onChange={updateField("sellsTo")} />
          </Field>
          <Field label="Modelo de cobro">
            <TextInput
              value={form.revenueModel}
              onChange={updateField("revenueModel")}
            />
          </Field>
        </div>
        <div className="mt-8">
          <SectionLabel>Canales actuales de adquisición</SectionLabel>
          <div className="mt-4 flex flex-wrap gap-3">
            {acquisitionChannelOptions.map((channel) => (
              <Chip
                active={form.acquisitionChannels.includes(channel)}
                key={channel}
                onClick={() => toggleChannel(channel)}
              >
                {channel}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-7">
        <SectionLabel>Contexto de categoría</SectionLabel>
        <h2 className="mt-3 text-3xl font-extrabold">
          Datos para comparar e idear
        </h2>
        <div className="mt-8 grid gap-5 xl:grid-cols-4">
          <Field label="Ticket promedio">
            <TextInput
              value={form.averageTicket}
              onChange={updateField("averageTicket")}
            />
          </Field>
          <Field label="Ciclo de venta promedio">
            <TextInput
              min={0}
              type="number"
              value={form.averageSalesCycleDays}
              onChange={updateField("averageSalesCycleDays")}
            />
          </Field>
          <Field label="Competidor 1">
            <TextInput value={form.competitor1} onChange={updateField("competitor1")} />
          </Field>
          <Field label="Web competidor 1">
            <TextInput
              type="url"
              value={form.competitor1Web}
              onChange={updateField("competitor1Web")}
            />
          </Field>
          <Field label="Competidor 2">
            <TextInput value={form.competitor2} onChange={updateField("competitor2")} />
          </Field>
          <Field label="Web competidor 2">
            <TextInput
              type="url"
              value={form.competitor2Web}
              onChange={updateField("competitor2Web")}
            />
          </Field>
          <Field label="Competidor 3">
            <TextInput value={form.competitor3} onChange={updateField("competitor3")} />
          </Field>
          <Field label="Web competidor 3">
            <TextInput
              type="url"
              value={form.competitor3Web}
              onChange={updateField("competitor3Web")}
            />
          </Field>
          <Field className="xl:col-span-2" label="Notas de categoría">
            <TextArea
              value={form.categoryNotes}
              onChange={updateField("categoryNotes")}
            />
          </Field>
          <div className="xl:col-span-2">
            <Field label="Documentos reales">
              <div className="rounded-[24px] border border-dashed border-stone-300 bg-surface-raised p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-[18px] border border-border bg-white px-5 py-8 text-center transition hover:bg-muted">
                  {status === "uploading" ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  )}
                  <span className="mt-3 text-base font-extrabold">
                    Cargar PDF, DOCX, XLSX, CSV, TXT o MD
                  </span>
                  <span className="mt-1 text-sm leading-6 text-muted-foreground">
                    Núcleo extrae texto y lo usa como contexto invisible.
                  </span>
                  <input
                    accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.md,.json,.html,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    multiple
                    onChange={uploadFiles}
                    type="file"
                  />
                </label>
                {uploadedDocuments.length ? (
                  <div className="mt-5 grid gap-3">
                    {uploadedDocuments.map((document) => (
                      <div
                        className="flex items-start gap-3 rounded-[18px] border border-border bg-white p-4"
                        key={document.id}
                      >
                        <FileText className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold">
                            {document.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            {document.extractionStatus ?? "CARGADO"}
                            {document.sizeBytes
                              ? ` · ${Math.round(document.sizeBytes / 1024)} KB`
                              : ""}
                          </p>
                          {document.summary && (
                            <p className="mt-2 max-h-12 overflow-hidden text-sm leading-6 text-stone-600">
                              {document.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </Field>
          </div>
          <Field className="xl:col-span-2" label="Notas pegadas manualmente">
            <TextArea value={form.documents} onChange={updateField("documents")} />
          </Field>
        </div>
      </Card>
    </div>
  );
}
