import pg from "pg";
import type { IdeationRecord } from "../contracts/ideation.js";
import type { RegistrationRecord } from "../contracts/registration.js";
import type {
  AuditEvent,
  NucleoStore,
  StoredDiagnosisCycle,
  StoredDiagnosisVersion,
  StoredSignalsRun,
} from "./store.js";

const { Pool } = pg;

export class PostgresStore implements NucleoStore {
  private readonly pool: pg.Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: /sslmode=require|supabase|neon|vercel-storage/i.test(
        connectionString,
      )
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  async saveRegistration(registration: RegistrationRecord) {
    await this.ensureSchema();
    await this.pool.query(
      `insert into nucleo_registrations
        (id, cycle_id, company_id, license_id, input, output, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
        cycle_id = excluded.cycle_id,
        company_id = excluded.company_id,
        license_id = excluded.license_id,
        input = excluded.input,
        output = excluded.output,
        updated_at = excluded.updated_at`,
      [
        registration.id,
        registration.cycleId,
        registration.companyId,
        registration.licenseId,
        registration.input,
        registration.output,
        registration.createdAt,
        registration.updatedAt,
      ],
    );
  }

  async getRegistration(id: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_registrations where id = $1 limit 1`,
      [id],
    );

    return result.rows[0] ? this.toRegistration(result.rows[0]) : null;
  }

  async getRegistrationByCycle(cycleId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_registrations where cycle_id = $1 order by updated_at desc limit 1`,
      [cycleId],
    );

    return result.rows[0] ? this.toRegistration(result.rows[0]) : null;
  }

  async listCompanyRegistrations(companyId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_registrations where company_id = $1 order by updated_at desc`,
      [companyId],
    );

    return result.rows.map((row) => this.toRegistration(row));
  }

  async saveDiagnosisCycle(cycle: StoredDiagnosisCycle) {
    await this.ensureSchema();
    await this.pool.query(
      `insert into nucleo_diagnosis_cycles
        (cycle_id, company_id, license_id, input, diagnosis, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (cycle_id) do update set
        company_id = excluded.company_id,
        license_id = excluded.license_id,
        input = excluded.input,
        diagnosis = excluded.diagnosis,
        updated_at = excluded.updated_at`,
      [
        cycle.cycleId,
        cycle.companyId,
        cycle.licenseId,
        cycle.input,
        cycle.diagnosis ?? null,
        cycle.createdAt,
        cycle.updatedAt,
      ],
    );
  }

  async getDiagnosisCycle(cycleId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_diagnosis_cycles where cycle_id = $1 limit 1`,
      [cycleId],
    );

    return result.rows[0] ? this.toDiagnosisCycle(result.rows[0]) : null;
  }

  async listCompanyDiagnosisCycles(companyId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_diagnosis_cycles where company_id = $1 order by updated_at desc`,
      [companyId],
    );

    return result.rows.map((row) => this.toDiagnosisCycle(row));
  }

  async saveDiagnosisVersion(version: StoredDiagnosisVersion) {
    await this.ensureSchema();
    await this.pool.query(
      `insert into nucleo_diagnosis_versions
        (id, cycle_id, version, reason, corrected_sections, input, diagnosis, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (id) do update set
        corrected_sections = excluded.corrected_sections,
        input = excluded.input,
        diagnosis = excluded.diagnosis`,
      [
        version.id,
        version.cycleId,
        version.version,
        version.reason,
        version.correctedSections,
        version.input,
        version.diagnosis,
        version.createdAt,
      ],
    );
  }

  async listDiagnosisVersions(cycleId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_diagnosis_versions where cycle_id = $1 order by version asc`,
      [cycleId],
    );

    return result.rows.map((row) => this.toDiagnosisVersion(row));
  }

  async saveSignalsRun(run: StoredSignalsRun) {
    await this.ensureSchema();
    await this.pool.query(
      `insert into nucleo_signals_runs
        (id, cycle_id, company_id, license_id, input, output, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (cycle_id) do update set
        company_id = excluded.company_id,
        license_id = excluded.license_id,
        input = excluded.input,
        output = excluded.output,
        updated_at = excluded.updated_at`,
      [
        run.id,
        run.cycleId,
        run.companyId,
        run.licenseId,
        run.input,
        run.output,
        run.createdAt,
        run.updatedAt,
      ],
    );
  }

  async getSignalsRun(cycleId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_signals_runs where cycle_id = $1 limit 1`,
      [cycleId],
    );

    return result.rows[0] ? this.toSignalsRun(result.rows[0]) : null;
  }

  async saveIdeationRun(run: IdeationRecord) {
    await this.ensureSchema();
    await this.pool.query(
      `insert into nucleo_ideation_runs
        (id, cycle_id, company_id, license_id, input, output, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (cycle_id) do update set
        company_id = excluded.company_id,
        license_id = excluded.license_id,
        input = excluded.input,
        output = excluded.output,
        updated_at = excluded.updated_at`,
      [
        run.id,
        run.cycleId,
        run.companyId,
        run.licenseId,
        run.input,
        run.output,
        run.createdAt,
        run.updatedAt,
      ],
    );
  }

  async getIdeationRun(cycleId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_ideation_runs where cycle_id = $1 limit 1`,
      [cycleId],
    );

    return result.rows[0] ? this.toIdeationRun(result.rows[0]) : null;
  }

  async saveAuditEvent(event: AuditEvent) {
    await this.ensureSchema();
    await this.pool.query(
      `insert into nucleo_audit_events
        (id, cycle_id, company_id, license_id, stage, action, summary, metadata, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do nothing`,
      [
        event.id,
        event.cycleId ?? null,
        event.companyId ?? null,
        event.licenseId ?? null,
        event.stage,
        event.action,
        event.summary,
        event.metadata ?? {},
        event.createdAt,
      ],
    );
  }

  async listAuditEvents(cycleId: string) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `select * from nucleo_audit_events where cycle_id = $1 order by created_at asc`,
      [cycleId],
    );

    return result.rows.map((row) => this.toAuditEvent(row));
  }

  private ensureSchema() {
    this.ready ??= this.createSchema();
    return this.ready;
  }

  private async createSchema() {
    await this.pool.query(`
      create table if not exists nucleo_registrations (
        id text primary key,
        cycle_id text not null unique,
        company_id text not null,
        license_id text not null,
        input jsonb not null,
        output jsonb not null,
        created_at timestamptz not null,
        updated_at timestamptz not null
      );

      create table if not exists nucleo_diagnosis_cycles (
        cycle_id text primary key,
        company_id text not null,
        license_id text not null,
        input jsonb not null,
        diagnosis jsonb,
        created_at timestamptz not null,
        updated_at timestamptz not null
      );

      create table if not exists nucleo_diagnosis_versions (
        id text primary key,
        cycle_id text not null,
        version integer not null,
        reason text not null,
        corrected_sections jsonb not null,
        input jsonb not null,
        diagnosis jsonb not null,
        created_at timestamptz not null,
        unique (cycle_id, version)
      );

      create table if not exists nucleo_audit_events (
        id text primary key,
        cycle_id text,
        company_id text,
        license_id text,
        stage text not null,
        action text not null,
        summary text not null,
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null
      );

      create table if not exists nucleo_signals_runs (
        id text primary key,
        cycle_id text not null unique,
        company_id text not null,
        license_id text not null,
        input jsonb not null,
        output jsonb not null,
        created_at timestamptz not null,
        updated_at timestamptz not null
      );

      create table if not exists nucleo_ideation_runs (
        id text primary key,
        cycle_id text not null unique,
        company_id text not null,
        license_id text not null,
        input jsonb not null,
        output jsonb not null,
        created_at timestamptz not null,
        updated_at timestamptz not null
      );

      create index if not exists nucleo_registrations_company_idx on nucleo_registrations(company_id);
      create index if not exists nucleo_diagnosis_cycles_company_idx on nucleo_diagnosis_cycles(company_id);
      create index if not exists nucleo_diagnosis_versions_cycle_idx on nucleo_diagnosis_versions(cycle_id);
      create index if not exists nucleo_signals_runs_company_idx on nucleo_signals_runs(company_id);
      create index if not exists nucleo_ideation_runs_company_idx on nucleo_ideation_runs(company_id);
      create index if not exists nucleo_audit_events_cycle_idx on nucleo_audit_events(cycle_id);
    `);
  }

  private toRegistration(row: Record<string, unknown>): RegistrationRecord {
    return {
      id: String(row.id),
      cycleId: String(row.cycle_id),
      companyId: String(row.company_id),
      licenseId: String(row.license_id),
      input: row.input as RegistrationRecord["input"],
      output: row.output as RegistrationRecord["output"],
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    };
  }

  private toDiagnosisCycle(row: Record<string, unknown>): StoredDiagnosisCycle {
    return {
      cycleId: String(row.cycle_id),
      companyId: String(row.company_id),
      licenseId: String(row.license_id),
      input: row.input as StoredDiagnosisCycle["input"],
      diagnosis: (row.diagnosis ?? undefined) as StoredDiagnosisCycle["diagnosis"],
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    };
  }

  private toDiagnosisVersion(
    row: Record<string, unknown>,
  ): StoredDiagnosisVersion {
    return {
      id: String(row.id),
      cycleId: String(row.cycle_id),
      version: Number(row.version),
      reason: row.reason as StoredDiagnosisVersion["reason"],
      correctedSections:
        row.corrected_sections as StoredDiagnosisVersion["correctedSections"],
      input: row.input as StoredDiagnosisVersion["input"],
      diagnosis: row.diagnosis as StoredDiagnosisVersion["diagnosis"],
      createdAt: new Date(String(row.created_at)).toISOString(),
    };
  }

  private toAuditEvent(row: Record<string, unknown>): AuditEvent {
    return {
      id: String(row.id),
      cycleId: row.cycle_id ? String(row.cycle_id) : undefined,
      companyId: row.company_id ? String(row.company_id) : undefined,
      licenseId: row.license_id ? String(row.license_id) : undefined,
      stage: row.stage as AuditEvent["stage"],
      action: String(row.action),
      summary: String(row.summary),
      metadata: row.metadata as Record<string, unknown>,
      createdAt: new Date(String(row.created_at)).toISOString(),
    };
  }

  private toSignalsRun(row: Record<string, unknown>): StoredSignalsRun {
    return {
      id: String(row.id),
      cycleId: String(row.cycle_id),
      companyId: String(row.company_id),
      licenseId: String(row.license_id),
      input: row.input as StoredSignalsRun["input"],
      output: row.output as StoredSignalsRun["output"],
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    };
  }

  private toIdeationRun(row: Record<string, unknown>): IdeationRecord {
    return {
      id: String(row.id),
      cycleId: String(row.cycle_id),
      companyId: String(row.company_id),
      licenseId: String(row.license_id),
      input: row.input as IdeationRecord["input"],
      output: row.output as IdeationRecord["output"],
      createdAt: new Date(String(row.created_at)).toISOString(),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    };
  }
}
