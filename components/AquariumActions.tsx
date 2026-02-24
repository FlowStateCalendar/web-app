"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  aquariumId: string;
  cleanLevel: number;
};

export function AquariumActions({ aquariumId, cleanLevel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"clean" | "feed" | null>(null);

  async function handleClean() {
    setLoading("clean");
    try {
      const supabase = createClient();
      const newLevel = Math.min(100, cleanLevel + 25);
      await supabase
        .from("aquariums")
        .update({
          clean_level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", aquariumId);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleFeed() {
    setLoading("feed");
    try {
      const supabase = createClient();
      // Feed: update fish JSON (simplified – just bump last_fed in stored JSON if needed)
      // For minimal implementation we only update updated_at so UI refreshes
      await supabase
        .from("aquariums")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", aquariumId);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 flex gap-3">
      <button
        type="button"
        onClick={handleClean}
        disabled={loading !== null || cleanLevel >= 100}
        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading === "clean" ? "Cleaning…" : "Clean tank"}
      </button>
      <button
        type="button"
        onClick={handleFeed}
        disabled={loading !== null}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
      >
        {loading === "feed" ? "Feeding…" : "Feed fish"}
      </button>
    </div>
  );
}
