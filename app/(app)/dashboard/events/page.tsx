import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function dateKey(d: Date): string {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

type EventRow = {
  id: string;
  title: string;
  date: string;
  length: number | null;
  energy_cost: number | null;
  category: string | null;
};

export default async function AllEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, length, energy_cost, category")
    .eq("user_profile_id", user?.id)
    .order("date", { ascending: true });

  const byDate = new Map<string, EventRow[]>();
  if (events) {
    for (const event of events) {
      const d = new Date(event.date);
      const key = dateKey(d);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(event);
    }
  }

  const sortedDates = Array.from(byDate.keys()).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">All events</h1>
        <Link
          href="/dashboard"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to dashboard
        </Link>
      </div>
      {sortedDates.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          No upcoming events.
        </p>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((key, index) => {
            const dayEvents = byDate.get(key)!;
            const dayLabel = (() => {
              const d = new Date(key + "T12:00:00");
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const dStart = new Date(d);
              dStart.setHours(0, 0, 0, 0);
              if (dStart.getTime() === today.getTime()) return "Today";
              if (dStart.getTime() === tomorrow.getTime()) return "Tomorrow";
              return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
            })();
            return (
              <section key={key}>
                {index > 0 && (
                  <>
                    <hr className="mb-6 border-gray-200" />
                    <div className="mb-4" />
                  </>
                )}
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
                  {dayLabel}
                </h2>
                <ul className="space-y-3">
                  {dayEvents.map((event) => (
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
