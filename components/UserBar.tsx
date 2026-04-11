"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  PROFILE_AVATAR_KEYS,
  normalizeProfileAvatarKey,
  profileAvatarUrl,
  type ProfileAvatarKey,
} from "@/lib/aquarium-assets";

type Profile = {
  name: string | null;
  coins: number | null;
  xp: number | null;
  level: number | null;
  profile_picture: string | null;
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
  const [savingPicture, setSavingPicture] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<ProfileAvatarKey>(
    normalizeProfileAvatarKey(profile?.profile_picture)
  );

  useEffect(() => {
    setLocalProfile(profile);
    setEditName(profile?.name ?? "");
  }, [profile]);

  useEffect(() => {
    if (showProfile) {
      setSelectedAvatarKey(normalizeProfileAvatarKey(localProfile?.profile_picture));
    }
  }, [showProfile, localProfile?.profile_picture]);

  async function handleSaveName() {
    if (!user?.id) return;
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
        body: JSON.stringify({ name: editName.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to save name");
      setLocalProfile((p) => (p ? { ...p, name: editName.trim() || null } : p));
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePicture() {
    if (!user?.id) return;
    setSavingPicture(true);
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
        body: JSON.stringify({ profile_picture: selectedAvatarKey }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to save picture");
      setLocalProfile((p) =>
        p ? { ...p, profile_picture: selectedAvatarKey } : p
      );
    } finally {
      setSavingPicture(false);
    }
  }

  const displayName = localProfile?.name ?? user?.email ?? "User";
  const coins = localProfile?.coins ?? 0;
  const avatarSrc = profileAvatarUrl(localProfile?.profile_picture);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur" data-tour="user-bar">
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-gray-100"
        >
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-indigo-50 ring-1 ring-gray-200">
            <Image
              src={avatarSrc}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
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
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
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
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-2">Choose profile picture</p>
                <div className="grid grid-cols-3 gap-3">
                  {PROFILE_AVATAR_KEYS.map((key) => {
                    const src = profileAvatarUrl(key);
                    const selected = selectedAvatarKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedAvatarKey(key)}
                        className={`relative flex aspect-square items-center justify-center rounded-full p-0.5 outline-none transition ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          selected
                            ? "ring-2 ring-indigo-600 ring-offset-2"
                            : "ring-1 ring-gray-200 hover:ring-gray-300"
                        }`}
                        aria-label={`Select ${key}`}
                        aria-pressed={selected}
                      >
                        <Image
                          src={src}
                          alt=""
                          width={80}
                          height={80}
                          className="h-full w-full rounded-full object-cover"
                        />
                        {selected && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shadow">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleSavePicture}
                  disabled={savingPicture}
                  className="mt-3 w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingPicture ? "Saving…" : "Save picture"}
                </button>
              </div>
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
