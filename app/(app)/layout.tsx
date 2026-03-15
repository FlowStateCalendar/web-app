import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { TourProvider } from "@/components/TourProvider";
import { UserBar } from "@/components/UserBar";

const DEFAULT_BACKGROUND_COLOR = "#2d2d2d";
const LIGHT_BACKGROUND_COLOR = "#f9fafb";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("name, coins, xp, level")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_settings")
      .select("background_color")
      .eq("user_profile_id", user.id)
      .maybeSingle(),
  ]);

  const backgroundColor = settings?.background_color ?? DEFAULT_BACKGROUND_COLOR;
  const isDarkBackground = backgroundColor !== LIGHT_BACKGROUND_COLOR;

  return (
    <TourProvider>
      <div className="flex min-h-screen flex-col">
        <UserBar profile={profile} user={user} />
        <div
          className={`flex-1 pb-16 md:pb-0 ${isDarkBackground ? "text-gray-100" : "text-gray-900"}`}
          style={{ backgroundColor }}
        >
          {children}
        </div>
        <AppNav />
      </div>
    </TourProvider>
  );
}
