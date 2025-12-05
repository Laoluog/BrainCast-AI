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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 py-12 text-white sm:px-12 lg:px-16">
      <div className="flex w-full max-w-7xl flex-col gap-16">
        <header className="space-y-6">
          <Link
            href="/"
            className="font-roboto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            home
          </Link>
          <div className="space-y-6">
            <h1 className="font-roboto text-4xl font-bold uppercase tracking-widest sm:text-5xl lg:text-6xl">
              Case library
            </h1>
            <p className="font-roboto max-w-3xl text-base text-white/80 leading-relaxed sm:text-lg">
              A living list of every brain imaging experiment we have logged so far.
              Nothing glossy—just the data we have, when we captured it, and whether images rendered.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 border-l-2 border-white pl-6">
            {heroStats.map((stat) => (
              <span key={stat.label} className="font-roboto text-xs uppercase tracking-widest text-white/70">
                {stat.label}: <span className="font-bold text-white">{stat.value}</span>
              </span>
            ))}
          </div>
        </header>

        <section className="space-y-8 border-t border-white/20 pt-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/60">log entries</p>
            <Link
              href="/protected/brain/input"
              className="font-roboto inline-flex items-center gap-2 border-2 border-white px-6 py-2 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
            >
              New case
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>

          {cases.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-roboto text-xl font-bold uppercase tracking-widest text-white">No cases yet.</p>
              <p className="font-roboto mt-3 text-sm text-white/70">
                Add your first patient profile to start the log.
              </p>
              <Link
                href="/protected/brain/input"
                className="font-roboto mt-8 inline-flex items-center gap-2 border-2 border-white px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
              >
                Begin new record
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {cases.map((caseItem) => {
                const title = getCaseTitle(caseItem);
                const assetCount =
                  (caseItem.ehrFiles?.length ?? 0) +
                  (caseItem.ctScans?.length ?? 0);
                const imageCount = Object.values(caseItem.images ?? {}).filter(Boolean).length;
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
                    className="block border-b border-white/20 pb-6 transition hover:border-white/60"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <p className="font-roboto text-xs uppercase tracking-widest text-white/50">
                          {formatDate(caseItem.createdAt)}
                        </p>
                        <h3 className="font-roboto text-2xl font-bold uppercase tracking-wider text-white">{title}</h3>
                        {caseItem.patient.notes ? (
                          <p className="font-roboto text-sm text-white/70">{caseItem.patient.notes}</p>
                        ) : null}
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-white/70" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 font-roboto text-xs text-white/70">
                      <span className="inline-flex items-center gap-2">
                        <Files className="h-3 w-3" />
                        {assetCount} asset{assetCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ImageIcon className="h-3 w-3" />
                        {imageCount} render{imageCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-3 w-3" />
                        {renderStatus}
                      </span>
                    </div>
                    {caseItem.basePrompt ? (
                      <p className="font-roboto mt-3 text-sm text-white/60">
                        "{caseItem.basePrompt}"
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


