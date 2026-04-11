"use client";

import { useState } from "react";
import { AquariumScene } from "@/components/AquariumScene";
import { AquariumActions } from "@/components/AquariumActions";
import { AquariumStats } from "@/components/AquariumStats";
import { FishListWithRename } from "@/components/FishListWithRename";
import { FishDetailModal } from "@/components/FishDetailModal";
import { TankTypeSwitcher } from "@/components/TankTypeSwitcher";

function parseFishCount(fish: string | unknown | null): number {
  if (fish == null) return 0;
  const arr =
    typeof fish === "string"
      ? (() => {
          try {
            return JSON.parse(fish);
          } catch {
            return [];
          }
        })()
      : fish;
  return Array.isArray(arr) ? arr.length : 0;
}

function parseAccessoryCount(accessories: string | unknown | null): number {
  if (accessories == null) return 0;
  const arr =
    typeof accessories === "string"
      ? (() => {
          try {
            return JSON.parse(accessories);
          } catch {
            return [];
          }
        })()
      : accessories;
  return Array.isArray(arr) ? arr.length : 0;
}

function normalizeOwnedTanks(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x).toLowerCase());
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map((x) => String(x).toLowerCase()) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function AquariumExperience({
  aquariumId,
  title,
  cleanLevel,
  tankType,
  fishJson,
  accessoriesJson,
  ownedTanksRaw,
  shellBackgroundHex,
}: {
  aquariumId: string;
  title: string | null;
  cleanLevel: number | null;
  tankType: string;
  fishJson: string | unknown | null;
  accessoriesJson: string | unknown | null;
  ownedTanksRaw: unknown;
  shellBackgroundHex: string;
}) {
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const owned = normalizeOwnedTanks(ownedTanksRaw);

  return (
    <div className="space-y-6">
      <AquariumScene
        tankType={tankType}
        fishJson={fishJson}
        accessoriesJson={accessoriesJson}
        shellBackgroundHex={shellBackgroundHex}
        onFishClick={(i) => setDetailIndex(i)}
      />
      {owned.length > 1 && (
        <TankTypeSwitcher currentTankType={tankType} ownedTanks={owned} />
      )}
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Clean level: {cleanLevel ?? 0}% · Tank: {tankType}
          </p>
        </div>
        <AquariumActions aquariumId={aquariumId} cleanLevel={cleanLevel ?? 0} />
      </div>
      <AquariumStats
        cleanLevel={cleanLevel ?? 0}
        fishCount={parseFishCount(fishJson)}
        accessoryCount={parseAccessoryCount(accessoriesJson)}
        tankType={tankType}
      />
      <FishListWithRename
        aquariumId={aquariumId}
        fishJson={fishJson}
        onOpenDetail={(i) => setDetailIndex(i)}
      />
      {detailIndex !== null && (
        <FishDetailModal
          aquariumId={aquariumId}
          fishJson={fishJson}
          index={detailIndex}
          onClose={() => setDetailIndex(null)}
        />
      )}
    </div>
  );
}
