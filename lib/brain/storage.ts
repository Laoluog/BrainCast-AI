import { CaseData, PatientInfo, Timepoint } from "./types";

const STORAGE_KEY = "brain_cases_v1";

function loadAll(): Record<string, CaseData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CaseData>) : {};
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, CaseData>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function listLocalCases(): CaseData[] {
  const all = loadAll();
  return Object.values(all).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0
  );
}

export function createLocalCase(input: {
  patient: PatientInfo;
  basePrompt: string;
  ehrFiles: File[];
  ctScans: File[];
}): CaseData {
  const id = `case_${Math.random().toString(36).slice(2, 10)}`;
  const images: CaseData["images"] = {};
  const meta = (f: File) => ({ name: f.name, size: f.size, type: f.type });
  const created: CaseData = {
    id,
    createdAt: new Date().toISOString(),
    patient: input.patient,
    basePrompt: input.basePrompt,
    ehrFiles: input.ehrFiles.map(meta),
    ctScans: input.ctScans.map(meta),
    images,
  };
  const all = loadAll();
  all[id] = created;
  saveAll(all);
  return created;
}

export function getLocalCase(caseId: string): CaseData | null {
  const all = loadAll();
  return all[caseId] ?? null;
}

function placeholder(seed: string, timepoint: Timepoint): string {
  // Using <img>, so no Next.js image config needed
  return `https://picsum.photos/seed/${encodeURIComponent(`${seed}-${timepoint}`)}/960/720`;
}

export function generateLocalImages(
  caseId: string,
  additionalPrompt?: string,
  selected?: Timepoint[]
): CaseData | null {
  const all = loadAll();
  const existing = all[caseId];
  if (!existing) return null;
  const timepoints: Timepoint[] = selected ?? ["now", "3m", "6m", "12m"];
  for (const tp of timepoints) {
    existing.images[tp] = {
      url: placeholder(caseId, tp),
      timepoint: tp,
      promptUsed: additionalPrompt
        ? `${existing.basePrompt} ${additionalPrompt}`.trim()
        : existing.basePrompt,
    };
  }
  all[caseId] = existing;
  saveAll(all);
  return existing;
}


