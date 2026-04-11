"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shopItemImageUrl } from "@/lib/aquarium-assets";
import type { AquariumFishItem } from "@/lib/fish-types";

function parseFishList(raw: string | unknown | null): AquariumFishItem[] {
  if (raw == null) return [];
  const parsed =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return [];
          }
        })()
      : raw;
  return Array.isArray(parsed) ? (parsed as AquariumFishItem[]) : [];
}

export function FishDetailModal({
  aquariumId,
  fishJson,
  index,
  onClose,
}: {
  aquariumId: string;
  fishJson: string | unknown | null;
  index: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const fishList = parseFishList(fishJson);
  const fish = fishList[index];
  const [renameValue, setRenameValue] = useState(fish?.customName?.trim() ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRenameValue(fish?.customName?.trim() ?? "");
  }, [fish?.customName, index]);

  if (!fish) {
    return null;
  }

  const displayName = fish.customName?.trim() || fish.name;
  const img = fish.image ? shopItemImageUrl(fish.image) : "";

  async function saveRename() {
    if (index < 0 || index >= fishList.length) return;
    setSaving(true);
    try {
      const updated = [...fishList];
      updated[index] = {
        ...updated[index],
        customName: renameValue.trim() || null,
      };
      const supabase = createClient();
      await supabase
        .from("aquariums")
        .update({
          fish: JSON.stringify(updated),
          updated_at: new Date().toISOString(),
        })
        .eq("id", aquariumId);
      router.refresh();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fish-detail-title"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <div className="flex items-start gap-4">
          {img ? (
            <div className="relative h-16 w-16 shrink-0">
              <Image src={img} alt="" width={64} height={64} className="h-full w-full object-contain" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 id="fish-detail-title" className="text-lg font-semibold text-gray-900">
              {displayName}
            </h3>
            <p className="text-xs text-gray-500">Species: {fish.name}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-500">Health</dt>
          <dd className="font-medium text-gray-900">{fish.health ?? "—"}</dd>
          <dt className="text-gray-500">Happiness</dt>
          <dd className="font-medium text-gray-900">{fish.happiness ?? "—"}</dd>
        </dl>
        <div className="mt-4">
          <label htmlFor="fish-rename" className="text-xs text-gray-500">
            Custom name
          </label>
          <input
            id="fish-rename"
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={fish.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={saveRename}
            disabled={saving}
            className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save name"}
          </button>
        </div>
      </div>
    </div>
  );
}
