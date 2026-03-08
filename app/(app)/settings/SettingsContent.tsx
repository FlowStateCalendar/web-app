"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExpandableSection } from "@/components/ExpandableSection";
import { SignOutButton } from "@/components/SignOutButton";

const SOUND_ENABLED_KEY = "soundEnabled";

export function SettingsContent({
  profile,
  userEmail,
}: {
  profile: { name: string | null; xp: number | null; level: number | null; coins: number | null } | null;
  userEmail: string | null;
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      setSoundEnabled(stored !== "false");
    }
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_ENABLED_KEY, String(next));
    }
  }

  async function saveName() {
    setSavingName(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${baseUrl}/functions/v1/user-profile-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: nameValue.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to save name");
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <ExpandableSection title="General">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={toggleSound}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700">Sound effects</span>
          </label>
          <p className="text-xs text-gray-500">Haptic feedback is not available on web.</p>
        </div>
      </ExpandableSection>

      <ExpandableSection title="Notifications">
        <p className="text-sm text-gray-500">Set default notification settings here. (Coming soon.)</p>
      </ExpandableSection>

      <ExpandableSection title="Tasks">
        <p className="text-sm text-gray-500">Set default task options here. (Coming soon.)</p>
      </ExpandableSection>

      <ExpandableSection title="Google Classroom">
        <p className="text-sm text-gray-500">Connect Google account and import from Classroom. (Coming soon.)</p>
      </ExpandableSection>

      <ExpandableSection title="Account" defaultOpen>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            {editingName ? (
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={savingName}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingName ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingName(false); setNameValue(profile?.name ?? ""); }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="font-medium text-gray-900">
                {profile?.name ?? userEmail ?? "—"}
                {" "}
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Edit
                </button>
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{userEmail ?? "—"}</p>
          </div>
          {profile && (
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Level {profile.level ?? 1}</span>
              <span>{profile.xp ?? 0} XP</span>
              <span>{profile.coins ?? 0} coins</span>
            </div>
          )}
          <SignOutButton />
        </div>
      </ExpandableSection>
    </div>
  );
}
