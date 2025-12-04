"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Files,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { CaseData } from "@/lib/brain/types";
import { listCasesSupabase } from "@/lib/brain/db";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(value));

const getCaseTitle = (caseItem: CaseData) => {
  const { firstName, lastName } = caseItem.patient;
  if (firstName || lastName) {
    return `${firstName ?? ""} ${lastName ?? ""}`.trim();
  }
  return "Untitled case";
};

export default function AllCasesPage() {
  const [cases, setCases] = useState<CaseData[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await listCasesSupabase();
        setCases(list);
      } catch {
        setCases([]);
      }
    })();
  }, []);

  const heroStats = useMemo(() => {
    const totalAssets = cases.reduce(
      (acc, current) =>
        acc + (current.ehrFiles?.length ?? 0) + (current.ctScans?.length ?? 0),
      0,
    );
    const fullyRendered = cases.filter(
      (c) => Object.values(c.images ?? {}).filter(Boolean).length >= 4,
    ).length;
    return [
      {
        label: "Live cases",
        value: cases.length,
        detail: "ready to explore",
      },
      {
        label: "Uploaded artifacts",
        value: totalAssets,
        detail: "EHR + CT payloads",
      },
      {
        label: "Fully rendered",
        value: fullyRendered,
        detail: "all timelines online",
      },
    ];
  }, [cases]);

  return (
    <div className="relative isolate overflow-hidden rounded-[48px] bg-slate-950/95 text-white shadow-[0_35px_80px_rgba(2,6,23,0.85)]">
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-0 hero-gradient" aria-hidden />
        <div className="absolute inset-0 grid-overlay" aria-hidden />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-blue-600/25 blur-[160px]" />
        <div className="absolute -bottom-24 right-12 h-72 w-72 rounded-full bg-cyan-500/25 blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-10 p-6 sm:p-10 lg:p-14">
        <header className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to cortex
          </Link>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/70">
              <Sparkles className="h-3 w-3" />
              case operations
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Orbit every brain narrative
              </h1>
              <p className="text-base text-white/80 sm:text-lg">
                Review curated patient journeys with cinematic clarity. Filter,
                reopen, or continue generation from any orbiting card below.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur"
              >
                <div className="text-xs uppercase tracking-[0.4em] text-white/50">
                  {stat.label}
                </div>
                <div className="mt-2 text-3xl font-semibold">{stat.value}</div>
                <p className="text-sm text-white/70">{stat.detail}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                case stream
              </p>
              <h2 className="text-2xl font-semibold">Active trajectories</h2>
            </div>
            <Link
              href="/protected/brain/input"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 px-6 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
            >
              Spark new case
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>

          {cases.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/20 bg-slate-900/60 p-10 text-center text-white/80">
              <p className="text-lg font-medium">No cases yet.</p>
              <p className="text-sm text-white/70">
                Drop in patient data to awaken your first Luminova story.
              </p>
              <Link
                href="/protected/brain/input"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 px-6 py-2 text-sm font-semibold"
              >
                Begin with a new case
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {cases.map((caseItem) => {
                const title = getCaseTitle(caseItem);
                const assetCount =
                  (caseItem.ehrFiles?.length ?? 0) +
                  (caseItem.ctScans?.length ?? 0);
                const imageCount = Object.values(caseItem.images ?? {}).filter(
                  Boolean,
                ).length;
                const renderStatus =
                  imageCount === 0
                    ? "Awaiting render"
                    : imageCount >= 4
                      ? "Fully rendered"
                      : `${imageCount}/4 renders online`;

                return (
                  <Link
                    key={caseItem.id}
                    href={`/protected/brain/${caseItem.id}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-white/40"
                  >
                    <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-slate-900/10 to-cyan-500/10" />
                    </div>
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                          {formatDate(caseItem.createdAt)}
                        </p>
                        <h3 className="text-xl font-semibold">{title}</h3>
                        {caseItem.patient.notes ? (
                          <p className="text-sm text-white/70">
                            {caseItem.patient.notes}
                          </p>
                        ) : null}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm font-semibold text-white transition group-hover:border-white/60">
                        Open orbit
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="relative mt-5 flex flex-wrap gap-3 text-sm text-white/80">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                        <Files className="h-4 w-4" />
                        {assetCount} asset{assetCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                        <ImageIcon className="h-4 w-4" />
                        {imageCount} render{imageCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                        <Clock3 className="h-4 w-4" />
                        {renderStatus}
                      </span>
                    </div>
                    {caseItem.basePrompt ? (
                      <p className="mt-4 text-sm text-white/70">
                        “{caseItem.basePrompt}”
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


