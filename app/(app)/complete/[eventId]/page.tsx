import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompletingTaskView } from "@/components/CompletingTaskView";

type Props = { params: Promise<{ eventId: string }> };

export default async function CompleteEventPage({ params }: Props) {
  const { eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event, error } = await supabase
    .from("events")
    .select("id, title, date, length, energy_cost, category, base_xp, base_coins, user_profile_id")
    .eq("id", eventId)
    .eq("user_profile_id", user.id)
    .single();

  if (error || !event) redirect("/dashboard");

  const scheduledDate = new Date(event.date);
  const now = new Date();
  const isPast = scheduledDate.getTime() < now.setHours(0, 0, 0, 0);

  if (isPast) redirect("/dashboard");

  return (
    <CompletingTaskView
      event={{
        id: event.id,
        title: event.title,
        lengthSeconds: Number(event.length) || 0,
        energy: event.energy_cost ?? 0,
        category: event.category ?? "work",
        baseXp: event.base_xp ?? 0,
        baseCoins: event.base_coins ?? 0,
      }}
    />
  );
}
