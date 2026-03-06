import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShopView } from "./ShopView";

export default async function ShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <ShopView userCoins={profile?.coins ?? 0} />
    </div>
  );
}
