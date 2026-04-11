import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { profileAvatarUrl } from "@/lib/aquarium-assets";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: entries } = await supabase
    .from("user_profiles")
    .select("id, name, weekly_coins, profile_picture")
    .order("weekly_coins", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6" data-tour="leaderboard">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-gray-500">Weekly coins</p>
      </header>

      {entries && entries.length > 0 ? (
        <ol className="space-y-2">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                entry.id === user?.id
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
                  <Image
                    src={profileAvatarUrl(entry.profile_picture)}
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="font-medium text-gray-700 truncate">
                  #{index + 1} {entry.name ?? "Anonymous"}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-gray-900">
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
