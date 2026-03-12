"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExpandableSection } from "@/components/ExpandableSection";
import { SignOutButton } from "@/components/SignOutButton";

const BACKGROUND_PRESETS = [
  { value: "#2d2d2d", label: "Dark grey" },
  { value: "#f9fafb", label: "Light" },
] as const;

export function SettingsContent({
  profile,
  userEmail,
  userId,
  initialSettings,
  hasClassroomTokens = false,
}: {
  profile: { name: string | null; xp: number | null; level: number | null; coins: number | null } | null;
  userEmail: string | null;
  userId: string | null;
  initialSettings: { background_color: string; sound_enabled: boolean; notifications_enabled: boolean };
  hasClassroomTokens?: boolean;
}) {
  const [hasGoogleIdentity, setHasGoogleIdentity] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUserIdentities().then(({ data }) => {
      const hasGoogle = data?.identities?.some((i) => i.provider === "google") ?? false;
      setHasGoogleIdentity(hasGoogle);
    });
  }, []);
  const [soundEnabled, setSoundEnabled] = useState(initialSettings.sound_enabled);
  const [backgroundColor, setBackgroundColor] = useState(initialSettings.background_color);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [syncingClassroom, setSyncingClassroom] = useState(false);
  const [classroomSyncMessage, setClassroomSyncMessage] = useState<string | null>(null);

  async function upsertSettings(patch: { sound_enabled?: boolean; background_color?: string }) {
    if (!userId) return;
    setSavingSettings(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_profile_id: userId,
          sound_enabled: patch.sound_enabled ?? soundEnabled,
          background_color: patch.background_color ?? backgroundColor,
          notifications_enabled: initialSettings.notifications_enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_profile_id" }
      );
      if (error) throw error;
    } finally {
      setSavingSettings(false);
    }
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    upsertSettings({ sound_enabled: next });
  }

  function handleBackgroundChange(value: string) {
    setBackgroundColor(value);
    upsertSettings({ background_color: value });
  }

  async function handleLinkGoogle() {
    setLinkingGoogle(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/settings`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      setClassroomSyncMessage(err instanceof Error ? err.message : "Failed to link Google");
    } finally {
      setLinkingGoogle(false);
    }
  }

  async function handleSyncClassroom() {
    setClassroomSyncMessage(null);
    setSyncingClassroom(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${baseUrl}/functions/v1/sync-google-classroom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Sync failed");
      setClassroomSyncMessage("Synced successfully.");
    } catch (err) {
      setClassroomSyncMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingClassroom(false);
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
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-gray-500">Background colour</p>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_PRESETS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleBackgroundChange(value)}
                  disabled={savingSettings}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    backgroundColor === value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
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
        <div className="space-y-3">
          {classroomSyncMessage && (
            <p className={`text-sm ${classroomSyncMessage.startsWith("Synced") ? "text-green-600" : "text-red-600"}`}>
              {classroomSyncMessage}
            </p>
          )}
          {!hasGoogleIdentity && (
            <div>
              <p className="mb-2 text-sm text-gray-700">Link your Google account to sign in with Google and use Classroom sync.</p>
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={linkingGoogle}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {linkingGoogle ? "Redirecting…" : "Link Google account"}
              </button>
            </div>
          )}
          {!hasClassroomTokens && (
            <div>
              <p className="mb-2 text-sm text-gray-700">Connect Google for Classroom to import assignments as events.</p>
              <a
                href="/auth/google-classroom"
                className="inline-block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Connect Google for Classroom
              </a>
            </div>
          )}
            <div>
              <button
                type="button"
                onClick={handleSyncClassroom}
                disabled={syncingClassroom}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {syncingClassroom ? "Syncing…" : "Sync Google Classroom"}
              </button>
            </div>
          )}
        </div>
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
