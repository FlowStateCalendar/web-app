import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "./SettingsContent";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name, xp, level, coins")
    .eq("id", user?.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </header>
      <SettingsContent profile={profile} userEmail={user?.email ?? null} />
    </div>
  );
}
