"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listLocalCases } from "@/lib/brain/storage";
import { CaseData } from "@/lib/brain/types";

export default function AllCasesPage() {
  const [cases, setCases] = useState<CaseData[]>([]);

  useEffect(() => {
    setCases(listLocalCases());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">All Cases</h1>
      {cases.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No cases yet. Create one from the home page.
        </div>
      ) : (
        <ul className="rounded border divide-y">
          {cases.map((c) => {
            const title =
              (c.patient.firstName || c.patient.lastName)
                ? `${c.patient.firstName ?? ""} ${c.patient.lastName ?? ""}`.trim()
                : "Untitled case";
            return (
              <li key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <Link href={`/protected/brain/${c.id}`} className="text-sm underline">
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


