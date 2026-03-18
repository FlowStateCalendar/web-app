import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const nextParam = requestUrl.searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  const redirectUrl = new URL(nextPath, request.url);

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // IMPORTANT: exchangeCodeForSession sets auth cookies on the Response.
    // If we redirect with a different Response object, the cookies would be lost and the user would appear logged out.
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const loginUrl = new URL(`/login`, request.url);
      loginUrl.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    // Ensure `user_profiles` exists for new users (unless you already have a DB trigger).
    const accessToken = exchangeData?.session?.access_token;
    if (accessToken) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/user-profile-ensure`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        });
      } catch {
        // Profile creation is best-effort; the app can retry later.
      }
    }

    return response;
  }

  return NextResponse.redirect(redirectUrl);
}
