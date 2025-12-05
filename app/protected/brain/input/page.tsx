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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 py-12 text-white sm:px-12 lg:px-16">
      <div className="flex w-full max-w-7xl flex-col gap-16">
        <header className="space-y-6">
          <Link
            href="/protected/brain/cases"
            className="font-roboto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            back to cases
          </Link>
          <div className="space-y-6">
            <h1 className="font-roboto text-4xl font-bold uppercase tracking-widest sm:text-5xl lg:text-6xl">
              New case worksheet
            </h1>
            <p className="font-roboto max-w-3xl text-base text-white/80 leading-relaxed sm:text-lg">
              We use this form to capture just enough patient context to run our imaging experiments.
              Fill out what you have—leave the rest blank.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 border-l-2 border-white pl-6">
            {microcopy.map((chip) => (
              <span key={chip} className="font-roboto text-xs uppercase tracking-widest text-white/70">
                {chip}
              </span>
            ))}
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-12 border-t border-white/20 pt-12 text-white" noValidate>
          <section className="space-y-6">
            <p className="font-roboto border-l-2 border-white pl-4 text-xs font-bold uppercase tracking-widest text-white/80">
              Patient details
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="firstName" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  First name
                </Label>
                <Input
                  id="firstName"
                  className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                  value={patient.firstName ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, firstName: e.target.value }))}
                  placeholder="Jane"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="lastName" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                  value={patient.lastName ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="age" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  Age
                </Label>
                <Input
                  id="age"
                  className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                  type="number"
                  min={0}
                  value={patient.age?.toString() ?? ""}
                  onChange={(e) =>
                    setPatient((p) => ({ ...p, age: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  placeholder="55"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="mrn" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  MRN (optional)
                </Label>
                <Input
                  id="mrn"
                  className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                  value={patient.mrn ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, mrn: e.target.value }))}
                  placeholder="123456"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-3">
                <Label htmlFor="notes" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  Clinical notes (optional)
                </Label>
                <Input
                  id="notes"
                  className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                  value={patient.notes ?? ""}
                  onChange={(e) => setPatient((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Brief summary or relevant conditions"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <p className="font-roboto border-l-2 border-white pl-4 text-xs font-bold uppercase tracking-widest text-white/80">
              Prompt + intent
            </p>
            <div className="flex flex-col gap-3">
              <Label htmlFor="basePrompt" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                Base prompt
              </Label>
              <Input
                id="basePrompt"
                className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                placeholder="Describe case context to guide image generation"
              />
            </div>
          </section>

          <section className="space-y-6">
            <p className="font-roboto border-l-2 border-white pl-4 text-xs font-bold uppercase tracking-widest text-white/80">
              File uploads
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="ehrFiles" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  EHR files (PDF/JSON/TXT/CSV)
                </Label>
                <Input
                  id="ehrFiles"
                  className="font-roboto border-2 border-white/30 bg-black text-white file:text-white"
                  type="file"
                  multiple
                  accept=".pdf,.json,.txt,.csv"
                  onChange={(e) => setEhrFiles(Array.from(e.target.files ?? []))}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="ctFiles" className="font-roboto text-xs uppercase tracking-widest text-white/80">
                  CT scans (DICOM/Images)
                </Label>
                <Input
                  id="ctFiles"
                  className="font-roboto border-2 border-white/30 bg-black text-white file:text-white"
                  type="file"
                  multiple
                  accept=".dcm,.dicom,.png,.jpg,.jpeg"
                  onChange={(e) => setCtFiles(Array.from(e.target.files ?? []))}
                />
              </div>
            </div>
            <p className="font-roboto mt-3 inline-flex items-center gap-2 text-xs text-white/60">
              <UploadCloud className="h-3 w-3" />
              Drag-and-drop coming soon—batch select for now.
            </p>
          </section>

          {error ? (
            <p className="font-roboto border-l-4 border-red-500 pl-4 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-6 border-t border-white/20 pt-8">
            <Button
              type="submit"
              disabled={submitting}
              className="font-roboto border-2 border-white bg-transparent px-10 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Save case"}
            </Button>
            <Link
              href="/protected/brain/cases"
              className="font-roboto text-sm font-bold uppercase tracking-widest text-white/70 transition hover:text-white"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


