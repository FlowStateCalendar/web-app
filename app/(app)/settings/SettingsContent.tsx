"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExpandableSection } from "@/components/ExpandableSection";
import { ProfilePicturePicker } from "@/components/ProfilePicturePicker";
import { SignOutButton } from "@/components/SignOutButton";
import { BACKGROUND_PRESETS } from "@/lib/theme-presets";
import { registerWebPushForUser, unregisterWebPushForUser } from "@/lib/web-push-register";

export function SettingsContent({
  profile,
  userEmail,
  userId,
  initialSettings,
  hasClassroomTokens = false,
}: {
  profile: {
    name: string | null;
    xp: number | null;
    level: number | null;
    coins: number | null;
    profile_picture: string | null;
  } | null;
  userEmail: string | null;
  userId: string | null;
  initialSettings: {
    background_color: string;
    sound_enabled: boolean;
    notifications_enabled: boolean;
    email_reminders_enabled: boolean;
    push_web_enabled: boolean;
    push_ios_enabled: boolean;
  };
  hasClassroomTokens?: boolean;
}) {
  const router = useRouter();
  const [pictureError, setPictureError] = useState<string | null>(null);
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialSettings.notifications_enabled);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(initialSettings.email_reminders_enabled);
  const [pushWebEnabled, setPushWebEnabled] = useState(initialSettings.push_web_enabled);
  const [pushIosEnabled, setPushIosEnabled] = useState(initialSettings.push_ios_enabled);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [syncingClassroom, setSyncingClassroom] = useState(false);
  const [classroomSyncMessage, setClassroomSyncMessage] = useState<string | null>(null);

  async function upsertSettings(patch: {
    sound_enabled?: boolean;
    background_color?: string;
    notifications_enabled?: boolean;
    email_reminders_enabled?: boolean;
    push_web_enabled?: boolean;
    push_ios_enabled?: boolean;
  }) {
    if (!userId) return;
    setSavingSettings(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_profile_id: userId,
          sound_enabled: patch.sound_enabled ?? soundEnabled,
          background_color: patch.background_color ?? backgroundColor,
          notifications_enabled: patch.notifications_enabled ?? notificationsEnabled,
          email_reminders_enabled: patch.email_reminders_enabled ?? emailRemindersEnabled,
          push_web_enabled: patch.push_web_enabled ?? pushWebEnabled,
          push_ios_enabled: patch.push_ios_enabled ?? pushIosEnabled,
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

  function toggleNotificationsEnabled() {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    upsertSettings({ notifications_enabled: next });
  }

  function toggleEmailReminders() {
    const next = !emailRemindersEnabled;
    setEmailRemindersEnabled(next);
    upsertSettings({ email_reminders_enabled: next });
  }

  async function togglePushWeb() {
    if (!userId) return;
    const next = !pushWebEnabled;
    setPushMessage(null);
    if (next) {
      const result = await registerWebPushForUser(userId);
      if (!result.ok) {
        setPushMessage(result.error ?? "Could not enable browser notifications.");
        return;
      }
    } else {
      await unregisterWebPushForUser(userId);
    }
    await upsertSettings({ push_web_enabled: next });
    setPushWebEnabled(next);
  }

  function togglePushIos() {
    const next = !pushIosEnabled;
    setPushIosEnabled(next);
    upsertSettings({ push_ios_enabled: next });
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
    <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm" data-tour="settings">
      <ExpandableSection title="General">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs text-gray-500">Background colour</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {BACKGROUND_PRESETS.map(({ value, label }) => {
                const selected = backgroundColor.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    onClick={() => handleBackgroundChange(value)}
                    disabled={savingSettings}
                    className={`group flex flex-col items-center gap-1 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      selected ? "ring-2 ring-indigo-600 ring-offset-2" : ""
                    }`}
                  >
                    <span
                      className="h-10 w-10 rounded-full border border-gray-300 shadow-inner"
                      style={{ backgroundColor: value }}
                      aria-hidden
                    />
                    <span className="max-w-[4.5rem] truncate text-center text-[10px] text-gray-600 group-hover:text-gray-900">
                      {label}
                    </span>
                  </button>
                );
              })}
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
        <div className="space-y-3 text-sm text-gray-700">
          <p className="text-xs text-gray-500">
            Reminders are sent by the server for upcoming tasks (email, browser push, and iPhone when the app has registered for push).
            Set <span className="font-medium">NEXT_PUBLIC_VAPID_PUBLIC_KEY</span> for browser push.
          </p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={toggleNotificationsEnabled}
              disabled={savingSettings}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span>Enable reminders (master)</span>
          </label>
          <label className={`flex items-center gap-2 ${!notificationsEnabled ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={emailRemindersEnabled}
              onChange={toggleEmailReminders}
              disabled={savingSettings || !notificationsEnabled}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span>Email reminders ({userEmail ?? "no email"})</span>
          </label>
          <label className={`flex items-center gap-2 ${!notificationsEnabled ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={pushWebEnabled}
              onChange={() => void togglePushWeb()}
              disabled={savingSettings || !notificationsEnabled}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span>Browser push notifications</span>
          </label>
          <label className={`flex items-center gap-2 ${!notificationsEnabled ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              checked={pushIosEnabled}
              onChange={togglePushIos}
              disabled={savingSettings || !notificationsEnabled}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <span>iPhone push (native app; avoids duplicate local alerts when enabled)</span>
          </label>
          {pushMessage && (
            <p className="text-xs text-red-600" role="alert">
              {pushMessage}
            </p>
          )}
        </div>
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
          {pictureError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {pictureError}
            </p>
          )}
          <ProfilePicturePicker
            initialProfilePicture={profile?.profile_picture ?? null}
            onSaved={() => router.refresh()}
            onError={setPictureError}
            onClearError={() => setPictureError(null)}
          />
          <p className="text-sm text-gray-600">
            You can also update your picture from the header (tap your avatar).
          </p>
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
