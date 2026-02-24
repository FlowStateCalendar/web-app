import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name")
    .eq("id", user?.id)
    .single();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, length, energy_cost, category")
    .eq("user_profile_id", user?.id)
    .gte("date", todayStart.toISOString())
    .lte("date", todayEnd.toISOString())
    .order("date", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Hi, {profile?.name ?? user?.email ?? "User"}
        </h1>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Today&apos;s Upcoming Events
        </h2>
        {events && events.length > 0 ? (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {Math.round((event.length ?? 0) / 60)} min
                  </p>
                </div>
                <Link
                  href={`/complete/${event.id}`}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Start Task
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
            No events scheduled for today. Add tasks in the Tasks section.
          </p>
        )}
      </section>
    </div>
  );
}
