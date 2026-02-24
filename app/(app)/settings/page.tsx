import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

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

      <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Name</p>
          <p className="font-medium text-gray-900">
            {profile?.name ?? user?.email ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium text-gray-900">{user?.email ?? "—"}</p>
        </div>
        {profile && (
          <div className="flex gap-6 text-sm">
            <span>Level {profile.level ?? 1}</span>
            <span>{profile.xp ?? 0} XP</span>
            <span>{profile.coins ?? 0} coins</span>
          </div>
        )}
        <SignOutButton />
      </div>
    </div>
  );
}
