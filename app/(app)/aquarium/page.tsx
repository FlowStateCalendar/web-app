import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AquariumActions } from "@/components/AquariumActions";
import { AquariumStats } from "@/components/AquariumStats";
import { FishListWithRename } from "@/components/FishListWithRename";

function parseFishCount(fish: string | unknown | null): number {
  if (fish == null) return 0;
  const arr = typeof fish === "string" ? (() => { try { return JSON.parse(fish); } catch { return []; } })() : fish;
  return Array.isArray(arr) ? arr.length : 0;
}

function parseAccessoryCount(accessories: string | unknown | null): number {
  if (accessories == null) return 0;
  const arr = typeof accessories === "string" ? (() => { try { return JSON.parse(accessories); } catch { return []; } })() : accessories;
  return Array.isArray(arr) ? arr.length : 0;
}

export default async function AquariumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: aquarium } = await supabase
    .from("aquariums")
    .select("id, title, clean_level, tank_type, fish, accessories, owned_tanks")
    .eq("user_profile_id", user?.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Aquarium</h1>
        <Link
          href="/aquarium/shop"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Shop
        </Link>
      </header>

      {aquarium ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-medium text-gray-900">{aquarium.title}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Clean level: {aquarium.clean_level ?? 0}%
            </p>
            <p className="text-sm text-gray-500">Tank: {aquarium.tank_type}</p>
            <AquariumActions
              aquariumId={aquarium.id}
              cleanLevel={aquarium.clean_level ?? 0}
            />
          </div>
          <AquariumStats
            cleanLevel={aquarium.clean_level ?? 0}
            fishCount={parseFishCount(aquarium.fish)}
            accessoryCount={parseAccessoryCount(aquarium.accessories)}
            tankType={aquarium.tank_type}
          />
          <FishListWithRename
            aquariumId={aquarium.id}
            fishJson={aquarium.fish}
          />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          No aquarium yet. One will be created when you complete tasks (or we
          can add a &quot;Create aquarium&quot; flow).
        </p>
      )}
    </div>
  );
}
