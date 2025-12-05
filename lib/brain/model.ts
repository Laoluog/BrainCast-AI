"use client";

import { PatientInfo } from "./types";

const BACKEND_URL = "http://127.0.0.1:5000"

export async function requestModelPrompt(input: {
  patient: PatientInfo;
  basePrompt: string;
  ehrFiles: File[];
  ctScans: File[];
}): Promise<string | null> {
  if (!BACKEND_URL) {
    return null;
  }
  const form = new FormData();
  form.set("base_prompt", input.basePrompt);
  form.set("patient", JSON.stringify(input.patient));
  input.ehrFiles.forEach((f) => form.append("ehr_files", f));
  input.ctScans.forEach((f) => form.append("ct_scans", f));

  const res = await fetch(`${BACKEND_URL}/model/prompt`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Backend error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { generated_prompt?: string };
  return data.generated_prompt ?? null;
}


