import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/AppNav";
import { UserBar } from "@/components/UserBar";

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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name, coins, xp, level")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <UserBar profile={profile} user={user} />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <AppNav />
    </div>
  );
}
