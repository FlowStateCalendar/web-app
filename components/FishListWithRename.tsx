"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FishItem = {
  id?: string;
  name: string;
  customName?: string | null;
  image?: string;
  health?: number;
  happiness?: number;
};

export function FishListWithRename({
  aquariumId,
  fishJson,
}: {
  aquariumId: string;
  fishJson: string | unknown | null;
}) {
  const router = useRouter();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const fishList: FishItem[] = (() => {
    if (fishJson == null) return [];
    const parsed = typeof fishJson === "string" ? (() => { try { return JSON.parse(fishJson); } catch { return []; } })() : fishJson;
    return Array.isArray(parsed) ? parsed : [];
  })();

  const editingFish = editingIndex !== null ? fishList[editingIndex] ?? null : null;

  async function saveRename(index: number) {
    if (index < 0 || index >= fishList.length) {
      setEditingIndex(null);
      return;
    }
    const updated = [...fishList];
    updated[index] = { ...updated[index], customName: renameValue.trim() || null };
    try {
      const supabase = createClient();
      await supabase
        .from("aquariums")
        .update({
          fish: JSON.stringify(updated),
          updated_at: new Date().toISOString(),
        })
        .eq("id", aquariumId);
      router.refresh();
    } finally {
      setEditingIndex(null);
    }
  }

  if (fishList.length === 0) {
    return (
      <p className="text-sm text-gray-500">No fish yet. Buy some in the Shop!</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Your fish</h3>
      <ul className="space-y-2">
        {fishList.map((fish, index) => {
          const displayName = fish.customName?.trim() || fish.name;
          return (
            <li
              key={fish.id ?? index}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="font-medium text-gray-900">🐠 {displayName}</span>
              <button
                type="button"
                onClick={() => {
                  setEditingIndex(index);
                  setRenameValue(fish.customName?.trim() || "");
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Rename
              </button>
            </li>
          );
        })}
      </ul>

      {editingFish && editingIndex !== null && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Rename fish</h3>
            <p className="mt-1 text-sm text-gray-500">
              Current: {editingFish.customName?.trim() || editingFish.name}
            </p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="New name"
              className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveRename(editingIndex)}
                className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
