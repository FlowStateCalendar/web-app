import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("user_profiles")
    .select("id, name, weekly_coins")
    .order("weekly_coins", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500">Weekly coins</p>
      </header>

      {entries && entries.length > 0 ? (
        <ol className="space-y-2">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                entry.id === user?.id
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="font-medium text-gray-700">
                #{index + 1} {entry.name ?? "Anonymous"}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {entry.weekly_coins ?? 0} coins
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
          No leaderboard data yet.
        </p>
      )}
    </div>
  );
}
