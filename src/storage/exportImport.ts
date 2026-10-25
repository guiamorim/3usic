import { ExportFileSchema, SCHEMA_VERSION, type AppData, type ExportFile } from './schema';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function buildExport(data: AppData, now = new Date()): ExportFile {
  return {
    app: 'braco-guitarra',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

export function serializeExport(data: AppData, now = new Date()): string {
  return JSON.stringify(buildExport(data, now), null, 2);
}

export function exportFileName(now = new Date()): string {
  return `braco-progresso-${now.toISOString().slice(0, 10)}.json`;
}

export type ImportResult =
  | { ok: true; file: ExportFile; summary: ImportSummary }
  | { ok: false; error: string };

export interface ImportSummary {
  exportedAt: string;
  hasProfile: boolean;
  lessons: number;
  attempts: number;
  practiceMinutes: number;
}

/**
 * Upgrades older export formats to the current one. Each future version adds a step here.
 * Files from a newer app version are rejected rather than guessed at.
 */
function migrate(raw: Record<string, unknown>): Record<string, unknown> | string {
  const v = raw.schemaVersion;
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) return 'Versão do ficheiro em falta ou inválida.';
  if (v > SCHEMA_VERSION) return 'Este ficheiro foi criado por uma versão mais recente da aplicação. Atualiza a aplicação e tenta de novo.';
  return raw;
}

function formatIssue(issue: { path: PropertyKey[]; message: string }): string {
  const path = issue.path.map(String).join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

/**
 * Parses and validates an import file. The content is only ever parsed as JSON and checked
 * against a strict schema — it is never evaluated or rendered as HTML.
 */
export function parseImport(text: string): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'O ficheiro é demasiado grande (máximo 5 MB).' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'O ficheiro não é JSON válido.' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'Formato inesperado: o ficheiro deve conter um objeto JSON.' };
  }
  const rec = raw as Record<string, unknown>;
  if (rec.app !== 'braco-guitarra') return { ok: false, error: 'Este ficheiro não foi exportado por esta aplicação.' };
  const migrated = migrate(rec);
  if (typeof migrated === 'string') return { ok: false, error: migrated };

  const parsed = ExportFileSchema.safeParse(migrated);
  if (!parsed.success) {
    const first = parsed.error.issues.slice(0, 3).map(formatIssue).join('; ');
    return { ok: false, error: `O ficheiro tem dados inválidos (${first}).` };
  }
  const file = parsed.data;
  const ids = new Set<string>();
  for (const a of file.data.attempts) {
    if (ids.has(a.id)) return { ok: false, error: 'O ficheiro contém registos duplicados.' };
    ids.add(a.id);
  }
  return {
    ok: true,
    file,
    summary: {
      exportedAt: file.exportedAt,
      hasProfile: file.data.profile !== null,
      lessons: file.data.lessons.length,
      attempts: file.data.attempts.length,
      practiceMinutes: Math.round(file.data.practice.reduce((s, p) => s + p.seconds, 0) / 60),
    },
  };
}
