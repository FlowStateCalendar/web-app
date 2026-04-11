import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AquariumExperience } from "@/components/AquariumExperience";

const DEFAULT_SHELL_BG = "#2d2d2d";

export default async function AquariumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: aquarium }, { data: userSettings }] = await Promise.all([
    supabase
      .from("aquariums")
      .select("id, title, clean_level, tank_type, fish, accessories, owned_tanks")
      .eq("user_profile_id", user?.id)
      .single(),
    supabase
      .from("user_settings")
      .select("background_color")
      .eq("user_profile_id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const shellBackgroundHex = userSettings?.background_color ?? DEFAULT_SHELL_BG;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" data-tour="aquarium">
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
        <AquariumExperience
          aquariumId={aquarium.id}
          title={aquarium.title}
          cleanLevel={aquarium.clean_level}
          tankType={aquarium.tank_type}
          fishJson={aquarium.fish}
          accessoriesJson={aquarium.accessories}
          ownedTanksRaw={aquarium.owned_tanks}
          shellBackgroundHex={shellBackgroundHex}
        />
      ) : (
        <div className="space-y-4 rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-700">
            No aquarium yet. Complete tasks to earn your tank, or explore the app to get started.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tasks"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to Tasks
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
