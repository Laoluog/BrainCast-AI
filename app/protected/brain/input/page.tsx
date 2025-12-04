"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Sparkles, UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PatientInfo } from "@/lib/brain/types";
import { createCaseSupabase, updateCaseImagesSupabase } from "@/lib/brain/db";
import { requestModelPrompt } from "@/lib/brain/model";
import { requestGeneratedImages } from "@/lib/brain/generator";
import type { Timepoint } from "@/lib/brain/types";

const inputPalette = "text-white placeholder:text-white/60 file:text-white";

export default function BrainInputPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientInfo>({});
  const [basePrompt, setBasePrompt] = useState("");
  const [ehrFiles, setEhrFiles] = useState<File[]>([]);
  const [ctFiles, setCtFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const microcopy = useMemo(
    () => [
      "Fuse multimodal evidence",
      "Guide cinematic synthesis",
      "Preview every timepoint",
    ],
    [],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      let generatedPrompt: string | null = null;
      try {
        generatedPrompt = await requestModelPrompt({
          patient,
          basePrompt,
          ehrFiles,
          ctScans: ctFiles,
        });
      } catch {
        // ignore backend failures, proceed with user-provided basePrompt
      }

      const created = await createCaseSupabase({
        patient,
        basePrompt,
        generatedPrompt: generatedPrompt ?? null,
        ehrFiles,
        ctScans: ctFiles,
      });

      const finalPrompt = generatedPrompt ?? basePrompt;
      try {
        const urls = await requestGeneratedImages({ prompt: finalPrompt });
        const tps: Timepoint[] = ["now", "3m", "6m", "12m"];
        const images = tps.reduce((acc, tp) => {
          const url = urls[tp];
          if (url) {
            acc[tp] = {
              url,
              timepoint: tp,
              promptUsed: finalPrompt,
            };
          }
          return acc;
        }, {} as Record<Timepoint, { url: string; timepoint: Timepoint; promptUsed: string }>);
        if (Object.keys(images).length > 0) {
          await updateCaseImagesSupabase(created.id, images);
        }
      } catch {
        // Allow user to continue even if image generation fails
      }

      router.push(`/protected/brain/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative isolate overflow-hidden rounded-[48px] bg-slate-950/95 text-white shadow-[0_35px_80px_rgba(2,6,23,0.85)]">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-0 hero-gradient" aria-hidden />
        <div className="absolute inset-0 grid-overlay" aria-hidden />
        <div className="absolute -top-20 left-1/3 h-64 w-64 rounded-full bg-blue-600/25 blur-[140px]" />
        <div className="absolute -bottom-24 right-16 h-72 w-72 rounded-full bg-cyan-500/25 blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-10 p-6 sm:p-10 lg:p-14">
        <header className="space-y-6">
          <Link
            href="/protected/brain/cases"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cases
          </Link>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
              <Sparkles className="h-3 w-3" />
              new neuro sketch
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Launch a luminous brain session
              </h1>
              <p className="text-base text-white/80 sm:text-lg">
                Anchor the patient signal, describe your cinematic intent, and
                upload the diagnostic evidence. Luminova syncs everything into a
                living, multi-timepoint story.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.4em] text-white/60">
            {microcopy.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-1"
              >
                {chip}
              </span>
            ))}
          </div>
        </header>

        <form
          onSubmit={onSubmit}
          className="space-y-8 text-white"
          noValidate
        >
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Patient signal
                </p>
                <h2 className="text-xl font-semibold">
                  Identity & key descriptors
                </h2>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                Core profile
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName" className="text-white/80">
                  First name
                </Label>
                <Input
                  id="firstName"
                  className={inputPalette}
                  value={patient.firstName ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Jane"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName" className="text-white/80">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  className={inputPalette}
                  value={patient.lastName ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="age" className="text-white/80">
                  Age
                </Label>
                <Input
                  id="age"
                  className={inputPalette}
                  type="number"
                  min={0}
                  value={patient.age?.toString() ?? ""}
                  onChange={(e) =>
                    setPatient((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  placeholder="55"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="mrn" className="text-white/80">
                  MRN (optional)
                </Label>
                <Input
                  id="mrn"
                  className={inputPalette}
                  value={patient.mrn ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, mrn: e.target.value }))}
                  placeholder="123456"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="notes" className="text-white/80">
                  Clinical notes (optional)
                </Label>
                <Input
                  id="notes"
                  className={inputPalette}
                  value={patient.notes ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Brief summary or relevant conditions"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Narrative pulse
                </p>
                <h2 className="text-xl font-semibold">
                  Describe the desired imagery
                </h2>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                Prompt lab
              </span>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Label htmlFor="basePrompt" className="text-white/80">
                Base prompt
              </Label>
              <Input
                id="basePrompt"
                className={inputPalette}
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                placeholder="Describe case context to guide image generation"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  Evidence upload
                </p>
                <h2 className="text-xl font-semibold">
                  Attach EHR + CT references
                </h2>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                Data uplink
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ehrFiles" className="text-white/80">
                  EHR files (PDF/JSON/TXT)
                </Label>
                <Input
                  id="ehrFiles"
                  className={inputPalette}
                  type="file"
                  multiple
                  accept=".pdf,.json,.txt,.csv"
                  onChange={(e) => setEhrFiles(Array.from(e.target.files ?? []))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ctFiles" className="text-white/80">
                  CT scans (DICOM/Images)
                </Label>
                <Input
                  id="ctFiles"
                  className={inputPalette}
                  type="file"
                  multiple
                  accept=".dcm,.dicom,.png,.jpg,.jpeg"
                  onChange={(e) => setCtFiles(Array.from(e.target.files ?? []))}
                />
              </div>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/70">
              <UploadCloud className="h-4 w-4" />
              Drag-and-drop coming soon — for now, batch-select files above.
            </p>
          </section>

          {error ? (
            <p className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 px-10 py-3 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:scale-[1.01]"
            >
              {submitting ? "Weaving assets..." : "Ignite imaging session"}
            </Button>
            <Link
              href="/protected/brain/cases"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline"
            >
              Prefer browsing first? Back to cases
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


