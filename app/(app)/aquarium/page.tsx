import { createClient } from "@/lib/supabase/server";
import { AquariumActions } from "@/components/AquariumActions";

export default async function AquariumPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: aquarium } = await supabase
    .from("aquariums")
    .select("id, title, clean_level, tank_type")
    .eq("user_profile_id", user?.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Aquarium</h1>
      </header>

      {aquarium ? (
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
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          No aquarium yet. One will be created when you complete tasks (or we
          can add a &quot;Create aquarium&quot; flow).
        </p>
      )}
    </div>
  );
}
