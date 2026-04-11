"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  PROFILE_AVATAR_KEYS,
  normalizeProfileAvatarKey,
  profileAvatarUrl,
  type ProfileAvatarKey,
} from "@/lib/aquarium-assets";

type Props = {
  initialProfilePicture: string | null;
  onSaved?: (key: ProfileAvatarKey) => void;
  onError?: (message: string) => void;
  /** Clears parent error when starting save */
  onClearError?: () => void;
};

export function ProfilePicturePicker({
  initialProfilePicture,
  onSaved,
  onError,
  onClearError,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<ProfileAvatarKey>(
    normalizeProfileAvatarKey(initialProfilePicture)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedKey(normalizeProfileAvatarKey(initialProfilePicture));
  }, [initialProfilePicture]);

  async function handleSave() {
    setSaving(true);
    onClearError?.();
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const res = await fetch(`${baseUrl}/functions/v1/user-profile-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profile_picture: selectedKey }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Failed to save picture");
      onSaved?.(selectedKey);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save picture.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-gray-500 mb-2 text-sm">Choose profile picture</p>
      <div className="grid grid-cols-3 gap-3">
        {PROFILE_AVATAR_KEYS.map((key) => {
          const src = profileAvatarUrl(key);
          const selected = selectedKey === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
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
        onClick={handleSave}
        disabled={saving}
        className="mt-3 w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save picture"}
      </button>
    </div>
  );
}
