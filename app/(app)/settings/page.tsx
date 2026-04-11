import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "./SettingsContent";

const DEFAULT_BACKGROUND_COLOR = "#2d2d2d";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: settings }, { data: classroomTokenRow }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("name, xp, level, coins, profile_picture")
      .eq("id", user?.id)
      .single(),
    supabase
      .from("user_settings")
      .select("background_color, sound_enabled, notifications_enabled")
      .eq("user_profile_id", user?.id ?? "")
      .maybeSingle(),
    supabase
      .from("google_classroom_tokens")
      .select("user_profile_id")
      .eq("user_profile_id", user?.id ?? "")
      .maybeSingle(),
  ]);

  const hasClassroomTokens = !!classroomTokenRow;

  const initialSettings = {
    background_color: settings?.background_color ?? DEFAULT_BACKGROUND_COLOR,
    sound_enabled: settings?.sound_enabled ?? true,
    notifications_enabled: settings?.notifications_enabled ?? true,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Settings</h1>
      </header>
      <SettingsContent
        profile={profile}
        userEmail={user?.email ?? null}
        userId={user?.id ?? null}
        initialSettings={initialSettings}
        hasClassroomTokens={hasClassroomTokens}
      />
    </div>
  );
}
