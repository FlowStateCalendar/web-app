/**
 * Register service worker + Web Push subscription and persist keys to Supabase.
 */
import { createClient } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerWebPushForUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublic || typeof window === "undefined") {
    return { ok: false, error: "Web Push is not configured (missing NEXT_PUBLIC_VAPID_PUBLIC_KEY)." };
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "This browser does not support Web Push." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted." };
  }

  const reg = await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
  await reg.update();

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic) as BufferSource,
    });
  }

  const key = sub.getKey("p256dh");
  const auth = sub.getKey("auth");
  if (!key || !auth) {
    return { ok: false, error: "Invalid push subscription keys." };
  }

  const toB64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
    }
    return btoa(binary);
  };

  const supabase = createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("push_subscriptions_web").upsert(
    {
      user_profile_id: userId,
      endpoint: sub.endpoint,
      p256dh: toB64(key),
      auth: toB64(auth),
      updated_at: now,
    },
    { onConflict: "user_profile_id,endpoint" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function unregisterWebPushForUser(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const reg = await navigator.serviceWorker.getRegistration("/sw-push.js");
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;

  const supabase = createClient();
  await supabase
    .from("push_subscriptions_web")
    .delete()
    .eq("user_profile_id", userId)
    .eq("endpoint", sub.endpoint);

  await sub.unsubscribe();
}
