"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type Profile = {
  name: string | null;
  coins: number | null;
  xp: number | null;
  level: number | null;
};

export function UserBar({
  profile,
  user,
}: {
  profile: Profile | null;
  user: User | null;
}) {
  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  async function handleSaveName() {
    if (!user?.id) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      await supabase
        .from("user_profiles")
        .update({ name: editName.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      setLocalProfile((p) => (p ? { ...p, name: editName.trim() || null } : p));
    } finally {
      setSavingName(false);
    }
  }

  const displayName = localProfile?.name ?? user?.email ?? "User";
  const coins = localProfile?.coins ?? 0;

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-100"
        >
          <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
            {displayName.charAt(0).toUpperCase()}
          </span>
          <span className="font-medium text-gray-900 truncate max-w-[140px]">
            Hi, {displayName.split("@")[0]}
          </span>
        </button>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
          <span className="text-amber-600" aria-hidden>
            🪙
          </span>
          <span className="font-semibold text-gray-900">{coins}</span>
        </div>
      </header>

      {showProfile && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Profile"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingName ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email ?? "—"}</p>
              </div>
              <div className="flex gap-4 pt-2">
                <span className="text-gray-600">Level {localProfile?.level ?? 1}</span>
                <span className="text-gray-600">{localProfile?.xp ?? 0} XP</span>
                <span className="text-gray-600">{localProfile?.coins ?? 0} coins</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="mt-4 w-full rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
