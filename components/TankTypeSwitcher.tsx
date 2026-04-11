"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LABELS: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function TankTypeSwitcher({
  currentTankType,
  ownedTanks,
}: {
  currentTankType: string;
  ownedTanks: string[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectTank(tankType: string) {
    if (tankType === currentTankType.toLowerCase()) return;
    setError(null);
    setPending(tankType);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");
      const res = await fetch(`${baseUrl}/functions/v1/aquarium-set-active-tank`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tankType }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Could not change tank");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to switch tank");
    } finally {
      setPending(null);
    }
  }

  if (ownedTanks.length <= 1) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-gray-600">Active tank</p>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {ownedTanks.map((t) => {
          const key = t.toLowerCase();
          const active = key === currentTankType.toLowerCase();
          return (
            <button
              key={key}
              type="button"
              disabled={!!pending}
              onClick={() => selectTank(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              } disabled:opacity-50`}
            >
              {pending === key ? "…" : LABELS[key] ?? key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
