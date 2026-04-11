"use client";

import Image from "next/image";
import Link from "next/link";
import { AQUARIUM_BACKGROUNDS, shopItemImageUrl } from "@/lib/aquarium-assets";
import { isDarkBackgroundColor } from "@/lib/color-luminance";
import { SHOP_CATALOG } from "@/lib/shop-catalog";

type FishItem = { id?: string; image?: string; name?: string };

const DEFAULT_SHELL = "#2d2d2d";

function parseJson<T>(raw: string | unknown | null, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

function tankImageKey(tankType: string): string {
  const t = tankType.toLowerCase();
  if (t === "large") return "LargeTank";
  if (t === "medium") return "MediumTank";
  return "SmallTank";
}

function hashPosition(id: string, salt: number): { left: number; top: number } {
  let h = salt >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return {
    left: 10 + (h % 78),
    top: 16 + ((h >> 9) % 54),
  };
}

function accessoryIconUrl(name: string): string | null {
  const item = SHOP_CATALOG.find((c) => c.type === "accessory" && c.name === name);
  if (!item) return null;
  const url = shopItemImageUrl(item.image);
  return url || null;
}

export function AquariumScene({
  tankType,
  fishJson,
  accessoriesJson,
  shellBackgroundHex = DEFAULT_SHELL,
  onFishClick,
}: {
  tankType: string;
  fishJson: string | unknown | null;
  accessoriesJson: string | unknown | null;
  shellBackgroundHex?: string;
  onFishClick?: (index: number) => void;
}) {
  const fishList: FishItem[] = parseJson<FishItem[]>(fishJson, []);
  const accessories = parseJson<{ id?: string; name?: string }[]>(accessoriesJson, []);
  const tankSrc = shopItemImageUrl(tankImageKey(tankType));
  const visibleFish = fishList.slice(0, 6);
  const moreCount = fishList.length - visibleFish.length;
  const shellHex = shellBackgroundHex?.trim() || DEFAULT_SHELL;
  const darkShell = isDarkBackgroundColor(shellHex);
  const backdropOpacity = darkShell ? "opacity-25" : "opacity-40";

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <div
        className={`absolute inset-0 bg-cover bg-center ${backdropOpacity}`}
        style={{ backgroundImage: `url(${AQUARIUM_BACKGROUNDS.fish})` }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-3 py-6 sm:px-6">
        <div className="relative w-full max-w-xl">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={tankSrc}
              alt=""
              fill
              className="object-contain drop-shadow-md"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
            <div
              className={`absolute inset-[16%_11%_20%_11%] ${
                visibleFish.length === 0 ? "pointer-events-auto" : "pointer-events-none"
              }`}
            >
              {visibleFish.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-2 text-center">
                  <p
                    className={`text-sm font-medium sm:text-base ${darkShell ? "text-white drop-shadow-md" : "text-gray-800"}`}
                  >
                    Your tank is ready — add fish from the Shop!
                  </p>
                  <Link
                    href="/aquarium/shop"
                    className="pointer-events-auto inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                  >
                    Open Shop
                  </Link>
                </div>
              ) : (
                visibleFish.map((fish, i) => {
                  const id = fish.id ?? `fish-${i}`;
                  const img = fish.image ? shopItemImageUrl(fish.image) : "";
                  if (!img) return null;
                  const { left, top } = hashPosition(String(id), i * 17);
                  const displayName = fish.name ?? "Fish";
                  return (
                    <div
                      key={id}
                      className="absolute h-9 w-9 sm:h-11 sm:w-11"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onFishClick?.(i)}
                        className="aquarium-fish-sprite block h-full w-full cursor-pointer rounded-full bg-transparent p-0 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
                        style={{ animationDelay: `${(i % 6) * 0.35}s` }}
                        aria-label={`View ${displayName}`}
                      >
                        <Image
                          src={img}
                          alt=""
                          width={44}
                          height={44}
                          loading={i === 0 ? "eager" : "lazy"}
                          className="h-full w-full object-contain drop-shadow"
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {moreCount > 0 && (
              <div
                className={`absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs font-medium ${
                  darkShell ? "bg-white/90 text-gray-900" : "bg-black/60 text-white"
                }`}
              >
                +{moreCount} more
              </div>
            )}
          </div>
        </div>
        {accessories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="w-full text-center text-xs font-medium text-gray-600">Decorations</span>
            {accessories.map((acc, i) => {
              const url = acc.name ? accessoryIconUrl(acc.name) : null;
              if (!url) return null;
              return (
                <div
                  key={acc.id ?? `acc-${i}`}
                  className="relative h-11 w-11 rounded-lg bg-white/80 p-1 shadow-sm ring-1 ring-gray-200"
                >
                  <Image
                    src={url}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
