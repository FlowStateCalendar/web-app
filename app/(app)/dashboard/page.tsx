import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StartTutorialButton } from "@/components/StartTutorialButton";
import { AQUARIUM_BACKGROUNDS } from "@/lib/aquarium-assets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const nextEvent = events && events.length > 0 ? events[0] : null;
  const restEvents = events && events.length > 1 ? events.slice(1) : [];

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-6" data-tour="dashboard-events">
      <div
        className="pointer-events-none absolute inset-0 -z-0 rounded-2xl bg-cover bg-center opacity-[0.14]"
        style={{ backgroundImage: `url(${AQUARIUM_BACKGROUNDS.fish})` }}
        aria-hidden
      />
      <section className="relative z-10 mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Today&apos;s Upcoming Events
          </h2>
          <div className="flex items-center gap-2">
            <StartTutorialButton />
            <Link
              href="/dashboard/events"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Show all events
            </Link>
          </div>
        </div>
        {nextEvent ? (
          <>
            <div className="mb-6 rounded-xl border-2 border-indigo-200 bg-indigo-50/80 p-4 shadow-sm">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-600">
                Next up
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{nextEvent.title}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(nextEvent.date).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {Math.round((nextEvent.length ?? 0) / 60)} min
                  </p>
                </div>
                <Link
                  href={`/complete/${nextEvent.id}`}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Start Task
                </Link>
              </div>
            </div>
            {restEvents.length > 0 && (
              <ul className="space-y-3">
                {restEvents.map((event) => (
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
            )}
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
            No events scheduled for today. Add tasks in the Tasks section.
          </p>
        )}
      </section>
    </div>
  );
}
