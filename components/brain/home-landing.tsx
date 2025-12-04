"use client";

import Image from "next/image";
import Link from "next/link";
import { Activity, Brain, Cpu, Radar, Scan, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { listCasesSupabase } from "@/lib/brain/db";

const PLATFORM_NAME = "Luminova Cortex Imaging Studio";
const BRAIN_GIF_URL = "https://scitechdaily.com/images/3D-Brain-Rotation.gif";

const floatingIcons = [
  { Icon: Brain, position: "top-2 left-6", size: "h-5 w-5" },
  { Icon: ShieldCheck, position: "-bottom-2 right-8", size: "h-6 w-6" },
  { Icon: Radar, position: "top-6 right-2", size: "h-5 w-5" },
  { Icon: Scan, position: "bottom-8 left-3", size: "h-5 w-5" },
  { Icon: Cpu, position: "top-1/3 -right-4", size: "h-4 w-4" },
  { Icon: Activity, position: "bottom-1/4 -left-3", size: "h-4 w-4" },
];

const experiencePills = [
  "Clinician-first interface",
  "Time-synced simulations",
  "HIPAA-ready workspace",
  "Adaptive guidance",
  "Audit-ready histories",
];

const capabilityDeck = [
  {
    title: "Precision pathways",
    description:
      "Compare longitudinal reconstructions with physician annotations layered on top of AI cues.",
    bullets: ["Voxel-level deltas", "Anomaly spotlight grid"],
  },
  {
    title: "Evidence fusion",
    description:
      "Securely blend multimodal data—EHR text, CT volumes, structured vitals—into one canvas.",
    bullets: ["Automatic de-identification", "Traceable uploads"],
  },
  {
    title: "Guided generation",
    description:
      "Craft imaging intents with validated templates, then iterate live as cohorts evolve.",
    bullets: ["Prompt blueprints", "Realtime variational controls"],
  },
];

export function HomeLanding() {
  const [caseCount, setCaseCount] = useState(0);
  const [brainPulse, setBrainPulse] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await listCasesSupabase();
        setCaseCount(list.length);
      } catch {
        setCaseCount(0);
      }
    })();

    return () => {
      if (pulseTimeout.current) {
        clearTimeout(pulseTimeout.current);
      }
    };
  }, []);

  const handleBrainTap = () => {
    if (pulseTimeout.current) {
      clearTimeout(pulseTimeout.current);
    }
    setBrainPulse(true);
    setTapCount((prev) => prev + 1);
    pulseTimeout.current = setTimeout(() => setBrainPulse(false), 650);
  };

  const highlightCards = [
    {
      label: "Curated cases",
      value: caseCount > 0 ? `${caseCount}+` : "syncing…",
      detail: "ready-to-explore scans",
    },
    {
      label: "Brain awakenings",
      value: tapCount,
      detail: "creative taps today",
    },
    {
      label: "Stability index",
      value: "99.2%",
      detail: "signal clarity",
    },
  ];

  return (
    <div className="relative isolate flex min-h-screen w-full flex-col items-center justify-center gap-16 overflow-hidden px-4 py-12 text-center text-white sm:px-10">
      <div className="absolute inset-0 hero-gradient" aria-hidden />
      <div className="absolute inset-0 grid-overlay" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[200px] opacity-60 bg-[radial-gradient(circle,_rgba(37,99,235,0.35),_transparent_60%)]" />

      <section className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-sky-300" />
          clinical release channel
        </div>
        <div className="text-sm text-white/60">
          {caseCount > 0 ? `${caseCount}+ live cases online` : "Syncing live cases"}
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            {PLATFORM_NAME}
          </h1>
          <p className="text-lg text-white/75 sm:text-xl">
            A physician-grade command center for immersive neuro visualization. Review timelined
            reconstructions, orchestrate AI-assisted prompts, and brief your care team from a
            single, trusted surface.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/protected/brain/input"
            className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:-translate-y-0.5"
          >
            Launch imaging session
            <span className="text-2xl transition group-hover:translate-x-1">↗</span>
          </Link>
          <Link
            href="/protected/brain/cases"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:-translate-y-0.5"
          >
            Review active cases
          </Link>
        </div>
      </section>

      <section className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-6">
        <div className="relative">
          <button
            type="button"
            onClick={handleBrainTap}
            className="brain-core"
            data-active={brainPulse}
            aria-live="polite"
            aria-label="Tap the brain to energize the studio"
          >
            <div className="relative h-28 w-28 md:h-32 md:w-32 overflow-hidden rounded-full border border-white/15 bg-slate-900/80 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <Image
                src={BRAIN_GIF_URL}
                alt="Spinning brain hologram"
                fill
                sizes="(max-width: 768px) 7rem, 8rem"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <span
              className={`brain-pulse-ring ${brainPulse ? "brain-pulse-ring--show" : ""}`}
            />
            <span className="absolute -bottom-10 text-xs uppercase tracking-[0.4em] text-white/60">
              tap to energize
            </span>
          </button>
          {floatingIcons.map(({ Icon, position, size }, index) => (
            <span
              key={`${position}-${index}`}
              className={`floating-icon ${position}`}
              style={{ animationDelay: `${index * 0.8}s` }}
              aria-hidden
            >
              <Icon className={`${size} text-white/80`} />
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-6 md:grid-cols-3">
          {highlightCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-lg transition hover:-translate-y-1 hover:border-white/30"
            >
              <div className="text-xs uppercase tracking-[0.4em] text-white/50">
                {item.label}
              </div>
              <div className="mt-3 text-3xl font-semibold">{item.value}</div>
              <p className="mt-1 text-sm text-white/70">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 w-full max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-sm uppercase tracking-[0.4em] text-white/60">
              Controls & safeguards
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {experiencePills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-sm uppercase tracking-[0.4em] text-white/60">
              Clinical modules
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {capabilityDeck.map((cap) => (
                <div key={cap.title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-left">
                  <h3 className="text-base font-semibold">{cap.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{cap.description}</p>
                  <ul className="mt-3 space-y-1 text-xs text-white/60">
                    {cap.bullets.map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


