"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { listCasesSupabase } from "@/lib/brain/db";

const PLATFORM_NAME = "BrainCast AI";
const BRAIN_GIF_URL = "https://scitechdaily.com/images/3D-Brain-Rotation.gif";

export function HomeLanding() {
  const [caseCount, setCaseCount] = useState(0);
  const [brainPulse, setBrainPulse] = useState(false);
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
    pulseTimeout.current = setTimeout(() => setBrainPulse(false), 650);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 py-12 text-white sm:px-12 lg:px-16">
      <div className="flex w-full max-w-7xl flex-col items-center gap-20 text-center">
        
        <section className="w-full space-y-8">
          <h1 className="font-roboto text-6xl font-bold tracking-widest sm:text-7xl lg:text-8xl">
            {PLATFORM_NAME}
          </h1>
          <p className="font-roboto mx-auto max-w-4xl text-lg leading-relaxed text-white/90 sm:text-xl lg:text-2xl">
            A research tool for generating time-series brain reconstructions from multimodal clinical data. 
            We're building interfaces that help clinicians explore longitudinal imaging scenarios.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/protected/brain/input"
              className="font-roboto border-2 border-white px-8 py-3 text-sm font-bold uppercase tracking-widest transition hover:bg-white hover:text-black"
            >
              Create case
            </Link>
            <Link
              href="/protected/brain/cases"
              className="font-roboto border-2 border-white/50 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/70 transition hover:border-white hover:text-white"
            >
              View cases
            </Link>
          </div>
        </section>

        <section className="flex w-full flex-col items-center gap-6">
          <button
            type="button"
            onClick={handleBrainTap}
            className="brain-core-minimal"
            data-active={brainPulse}
            aria-label="Interactive brain model"
          >
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-2 border-white md:h-48 md:w-48 lg:h-56 lg:w-56">
              <Image
                src={BRAIN_GIF_URL}
                alt="3D brain model"
                fill
                sizes="(max-width: 768px) 10rem, (max-width: 1024px) 12rem, 14rem"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <span className={`brain-pulse-ring-minimal ${brainPulse ? "brain-pulse-ring-minimal--show" : ""}`} />
          </button>
        </section>

        <section className="w-full space-y-12">
          <div className="space-y-6">
            <h2 className="font-roboto text-xs font-bold uppercase tracking-[0.3em] text-white/80">
              What we're building
            </h2>
            <p className="font-roboto mx-auto max-w-3xl text-base leading-relaxed text-white/90 sm:text-lg">
              This project combines EHR data, CT scans, and AI-generated prompts to visualize potential brain states 
              at multiple time horizons. Built with Next.js, Supabase, and Python—designed to be transparent, 
              reproducible, and useful for clinical research teams.
            </p>
          </div>

          <div className="grid gap-8 border-t border-white/20 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 border-l-2 border-white pl-4">
              <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/70">Current status</p>
              <p className="font-roboto text-sm text-white">
                {caseCount > 0 ? `${caseCount} cases documented` : "Initializing database"}
              </p>
            </div>
            <div className="space-y-2 border-l-2 border-white pl-4">
              <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/70">Stack</p>
              <p className="font-roboto text-sm text-white">Next.js · Supabase · Python · Flux</p>
            </div>
            <div className="space-y-2 border-l-2 border-white pl-4">
              <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/70">Focus areas</p>
              <p className="font-roboto text-sm text-white">Longitudinal visualization · Multimodal fusion</p>
            </div>
            <div className="space-y-2 border-l-2 border-white pl-4">
              <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/70">Team</p>
              <p className="font-roboto text-sm text-white">Small research group, open development</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


