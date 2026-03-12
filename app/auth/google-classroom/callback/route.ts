import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?classroom_error=${encodeURIComponent(error)}`, request.url));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_classroom_oauth_state")?.value;
  cookieStore.delete("google_classroom_oauth_state");

  if (!state || state !== storedState || !code) {
    return NextResponse.redirect(new URL("/settings?classroom_error=invalid_state", request.url));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?error=google_config", request.url));
  }

  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/auth/google-classroom/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error("Google token exchange failed:", errBody);
    return NextResponse.redirect(new URL("/settings?classroom_error=token_exchange", request.url));
  }

  const tokens = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!tokens.refresh_token) {
    return NextResponse.redirect(new URL("/settings?classroom_error=no_refresh_token", request.url));
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const supabaseClient = await createClient();
  const { error: upsertError } = await supabaseClient
    .from("google_classroom_tokens")
    .upsert(
      {
        user_profile_id: user.id,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_profile_id" }
    );

  if (upsertError) {
    console.error("Failed to store Google tokens:", upsertError);
    return NextResponse.redirect(new URL("/settings?classroom_error=store_failed", request.url));
  }

  return NextResponse.redirect(new URL("/settings?classroom=connected", request.url));
}
