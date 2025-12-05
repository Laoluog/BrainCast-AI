"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { CaseData, Timepoint } from "@/lib/brain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getCaseSupabase, generateImagesSupabase } from "@/lib/brain/db";
import { requestVeoVideo } from "@/lib/brain/video";

const ALL_TPS: Timepoint[] = ["now", "3m", "6m", "12m"];

export default function BrainCaseOutputPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [selected, setSelected] = useState<Record<Timepoint, boolean>>({
    now: true,
    "3m": true,
    "6m": true,
    "12m": true,
  });
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState<Record<Timepoint, boolean>>({
    now: false,
    "3m": false,
    "6m": false,
    "12m": false,
  });
  // Scrubber, compare slider, and annotations state
  const TP_ORDER: Timepoint[] = ["now", "3m", "6m", "12m"];
  const [scrubIndex, setScrubIndex] = useState<number>(0);
  const scrubTp = TP_ORDER[scrubIndex] as Timepoint;
  const [compareLeft, setCompareLeft] = useState<Timepoint>("now");
  const [compareRight, setCompareRight] = useState<Timepoint>("12m");
  const [comparePos, setComparePos] = useState<number>(50); // percent
  type Annotation = { id: string; x: number; y: number; label: string };
  const [annotations, setAnnotations] = useState<Record<Timepoint, Annotation[]>>({
    now: [],
    "3m": [],
    "6m": [],
    "12m": [],
  });
  const [annotateMode, setAnnotateMode] = useState<Record<Timepoint, boolean>>({
    now: false,
    "3m": false,
    "6m": false,
    "12m": false,
  });
  const [editingAnnoId, setEditingAnnoId] = useState<string | null>(null);
  const [showTimeScrubber, setShowTimeScrubber] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const anySelected = useMemo(
    () => ALL_TPS.some((tp) => selected[tp]),
    [selected]
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const found = await getCaseSupabase(caseId);
        setData(found);
      } catch (e) {
        setError("Case not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  const onGenerate = () => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const updated = await generateImagesSupabase({ caseId });
        setData(updated);
      } catch {
        setError("Failed to generate images");
      } finally {
        setLoading(false);
      }
    })();
  };

  const onReprompt = () => {
    if (!editText.trim()) return;
    const tps = ALL_TPS.filter((tp) => selected[tp]);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const updated = await generateImagesSupabase({
          caseId,
          additionalPrompt: editText.trim(),
          timepoints: tps,
        });
        setData(updated);
        setEditText("");
      } catch {
        setError("Failed to reprompt images");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 py-12 text-white sm:px-12 lg:px-16">
      <div className="flex w-full max-w-7xl flex-col gap-12">
        <header className="space-y-6">
          <Link
            href="/protected/brain/cases"
            className="font-roboto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            back to cases
          </Link>
          <div className="space-y-4">
            <h1 className="font-roboto text-3xl font-bold uppercase tracking-widest sm:text-4xl lg:text-5xl">
              Case: {data?.patient?.firstName ?? ""} {data?.patient?.lastName ?? ""}
              {data?.patient?.mrn ? ` - ${data.patient.mrn}` : ""}
            </h1>
            {loading ? <div className="font-roboto text-sm text-white/70">Loading...</div> : null}
            {error ? <div className="font-roboto text-sm text-red-400">{error}</div> : null}
          </div>
        </header>

        {data ? (
          <>
            {/* Time Scrubber preview */}
            <section className="space-y-6 border-t border-white/20 pt-12">
              <button
                onClick={() => setShowTimeScrubber(!showTimeScrubber)}
                className="flex w-full items-center justify-between border-l-2 border-white pl-4 transition hover:border-white/60"
              >
                <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/80">
                  Time Scrubber
                </p>
                {showTimeScrubber ? (
                  <ChevronUp className="h-5 w-5 text-white/70" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/70" />
                )}
              </button>
              {showTimeScrubber && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="font-roboto text-sm text-white/70">
                      {scrubTp === "now" ? "Now" : scrubTp.toUpperCase()}
                    </div>
                  </div>
                  <div className="relative w-full overflow-hidden bg-black border border-white/20 aspect-video">
                    {data.images[scrubTp]?.url ? (
                      <img
                        src={data.images[scrubTp]!.url}
                        alt={`${scrubTp} brain image`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-white/60">
                        No image for {scrubTp}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-roboto text-xs text-white/70">Now</span>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={scrubIndex}
                      onChange={(e) => setScrubIndex(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-roboto text-xs text-white/70">12m</span>
                  </div>
                </>
              )}
            </section>

            {/* Compare slider */}
            <section className="space-y-6">
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="flex w-full items-center justify-between border-l-2 border-white pl-4 transition hover:border-white/60"
              >
                <p className="font-roboto text-xs font-bold uppercase tracking-widest text-white/80">
                  Compare
                </p>
                {showCompare ? (
                  <ChevronUp className="h-5 w-5 text-white/70" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/70" />
                )}
              </button>
              {showCompare && (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="font-roboto text-xs text-white/70">Left</label>
                    <select
                      className="border border-white/30 rounded px-3 py-1 text-sm bg-black text-white font-roboto"
                      value={compareLeft}
                      onChange={(e) => setCompareLeft(e.target.value as Timepoint)}
                    >
                      {TP_ORDER.map((tp) => (
                        <option key={tp} value={tp}>
                          {tp === "now" ? "Now" : tp.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <label className="font-roboto text-xs text-white/70">Right</label>
                    <select
                      className="border border-white/30 rounded px-3 py-1 text-sm bg-black text-white font-roboto"
                      value={compareRight}
                      onChange={(e) => setCompareRight(e.target.value as Timepoint)}
                    >
                      {TP_ORDER.map((tp) => (
                        <option key={tp} value={tp}>
                          {tp === "now" ? "Now" : tp.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="relative w-full overflow-hidden rounded bg-black border border-white/20 aspect-video select-none">
                    {data.images[compareRight]?.url ? (
                      <img
                        src={data.images[compareRight]!.url}
                        alt={`${compareRight} brain image`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : null}
                    {data.images[compareLeft]?.url ? (
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${comparePos}%` }}
                      >
                        <img
                          src={data.images[compareLeft]!.url}
                          alt={`${compareLeft} brain image`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div
                      className="absolute top-0 bottom-0"
                      style={{ left: `calc(${comparePos}% - 1px)` }}
                    >
                      <div className="w-0.5 h-full bg-white/70" />
                      <div className="absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full bg-white/90 shadow border flex items-center justify-center text-xs font-medium">
                        ||
                      </div>
                    </div>
                  </div>
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={comparePos}
                      onChange={(e) => setComparePos(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </section>

            <section className="space-y-6">
              <p className="font-roboto border-l-2 border-white pl-4 text-xs font-bold uppercase tracking-widest text-white/80">
                All timepoints
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ALL_TPS.map((tp) => {
                  const img = data.images[tp];
                  return (
                    <div key={tp} className="space-y-3">
                      <div className="font-roboto text-sm font-bold uppercase tracking-widest text-white">
                        {tp === "now" ? "Current" : tp.toUpperCase()}
                      </div>
                      <div
                        className="aspect-video rounded overflow-hidden bg-black border border-white/20 flex items-center justify-center relative"
                    onClick={(e) => {
                      const imgEl = data.images[tp];
                      if (!annotateMode[tp] || !imgEl) return;
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      const x = (e.clientX - rect.left) / rect.width;
                      const y = (e.clientY - rect.top) / rect.height;
                      const id = `${tp}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                      setAnnotations((prev) => ({
                        ...prev,
                        [tp]: [...prev[tp], { id, x, y, label: "" }],
                      }));
                      setEditingAnnoId(id);
                    }}
                  >
                    {img ? (
                      /* Using <img> to avoid external image config */
                      <img
                        src={img.url}
                        alt={`${tp} brain image`}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => {
                          if (!annotateMode[tp]) setViewerUrl(img.url);
                        }}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">No image yet</span>
                    )}
                    {/* Annotations overlay */}
                    {annotations[tp].map((a) => (
                      <div
                        key={a.id}
                        className="absolute -translate-x-1/2 -translate-y-full"
                        style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
                      >
                        <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow" />
                        {editingAnnoId === a.id ? (
                          <input
                            className="mt-1 text-xs px-1 py-0.5 rounded border bg-white/90 text-black"
                            autoFocus
                            defaultValue={a.label}
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              setAnnotations((prev) => ({
                                ...prev,
                                [tp]: prev[tp].map((x) => (x.id === a.id ? { ...x, label: val } : x)),
                              }));
                              setEditingAnnoId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                (e.target as HTMLInputElement).blur();
                              }
                              if (e.key === "Escape") {
                                setEditingAnnoId(null);
                              }
                            }}
                          />
                        ) : a.label ? (
                          <div className="mt-1 text-xs px-1 py-0.5 rounded bg-white/90 text-black border shadow">
                            {a.label}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      size="sm"
                      disabled={!img || videoLoading[tp]}
                      className="bg-gray-300 text-black hover:bg-gray-400 disabled:opacity-50 font-roboto text-xs"
                      onClick={async () => {
                        if (!img || !data) return;
                        setVideoLoading((s) => ({ ...s, [tp]: true }));
                        try {
                          const prompt =
                            img.promptUsed || data.generatedPrompt || data.basePrompt || "";
                          const url = await requestVeoVideo({
                            imageUrl: img.url,
                            prompt,
                            seconds: 7,
                          });
                          setVideoUrl(url);
                        } catch {
                          // ignore for now
                        } finally {
                          setVideoLoading((s) => ({ ...s, [tp]: false }));
                        }
                      }}
                    >
                      {videoLoading[tp] ? "Generating video..." : "Generate Video"}
                    </Button>
                    <Button
                      size="sm"
                      className={`font-roboto text-xs ${
                        annotateMode[tp]
                          ? "bg-gray-400 text-black hover:bg-gray-500"
                          : "bg-gray-300 text-black hover:bg-gray-400"
                      }`}
                      onClick={() =>
                        setAnnotateMode((m) => ({ ...m, [tp]: !m[tp] }))
                      }
                    >
                      {annotateMode[tp] ? "Annotating…" : "Annotate"}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gray-300 text-black hover:bg-gray-400 font-roboto text-xs"
                      onClick={() =>
                        setAnnotations((prev) => ({ ...prev, [tp]: [] }))
                      }
                    >
                      Clear
                    </Button>
                    {videoUrl ? (
                      <a className="text-sm underline" href={videoUrl} target="_blank" rel="noreferrer">
                        Open video
                      </a>
                    ) : null}
                  </div>
                  {/* <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {img?.promptUsed ? `Prompt: ${img.promptUsed}` : "—"}
                  </div> */}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-6 border-t border-white/20 pt-12">
              <Button 
                onClick={onGenerate} 
                disabled={loading}
                className="font-roboto border-2 border-white bg-transparent px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black"
              >
                {loading ? "Working..." : "Generate Images"}
              </Button>
            </section>

            <section className="space-y-6">
              <p className="font-roboto border-l-2 border-white pl-4 text-xs font-bold uppercase tracking-widest text-white/80">
                Edit and Reprompt
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      className="font-roboto border-2 border-white/30 bg-black text-white placeholder:text-white/50"
                      placeholder="Describe treatments or changes to guide regeneration"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {ALL_TPS.map((tp) => (
                      <label key={tp} className="flex items-center gap-2 text-sm font-roboto text-white/80">
                        <Checkbox
                          checked={selected[tp]}
                          onCheckedChange={(checked) =>
                            setSelected((s) => ({ ...s, [tp]: Boolean(checked) }))
                          }
                        />
                        {tp === "now" ? "Now" : tp.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Button 
                    onClick={onReprompt} 
                    disabled={!editText.trim() || !anySelected || loading}
                    className="font-roboto border-2 border-white bg-transparent px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-50"
                  >
                    {loading ? "Working..." : "Reprompt Selected"}
                  </Button>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {viewerUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewerUrl(null)}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <img
              src={viewerUrl}
              alt="Expanded brain image"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="absolute top-2 right-2 rounded px-3 py-1 bg-white/90 text-black text-sm hover:bg-white"
              onClick={() => setViewerUrl(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {videoUrl ? (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVideoUrl(null)}
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="max-h-[90vh] max-w-[90vw] rounded shadow-lg bg-black"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="absolute top-2 right-2 rounded px-3 py-1 bg-white/90 text-black text-sm hover:bg-white"
              onClick={() => setVideoUrl(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}


