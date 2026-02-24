/**
 * Supabase Edge Function: complete-event
 *
 * Replaces iOS TaskCompletionService + RewardCalculationService + UserXPLevelService
 * for event completion. Clients (web + iOS) call this instead of doing reward logic locally.
 *
 * POST /functions/v1/complete-event
 * Body: { "eventId": "uuid", "completionPercentage": 0.0–1.0 }
 * Auth: Supabase JWT required. User may only complete their own events.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { xpForEvent, coinsForEvent } from "./reward-calculation.ts";
import { levelForXP, DAILY_XP_CAP } from "./xp-level.ts";
import { isTodayUTC, toISO8601 } from "./date-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CompleteEventRequest {
  eventId: string;
  completionPercentage: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await authClient.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    let body: CompleteEventRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { eventId, completionPercentage } = body;
    if (!eventId || typeof completionPercentage !== "number" || completionPercentage < 0 || completionPercentage > 1) {
      return new Response(
        JSON.stringify({ error: "eventId and completionPercentage (0–1) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, user_profile_id, title, description, date, length, energy_cost, category, base_xp, base_coins")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (event.user_profile_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Not allowed to complete this event" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, xp, level, coins, weekly_coins, xp_earned_today, last_xp_award_date")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventForReward = {
      base_xp: event.base_xp ?? 0,
      base_coins: event.base_coins ?? 0,
      length: Number(event.length) || 0,
    };

    let xpToAward = xpForEvent(eventForReward, completionPercentage);
    const coinsToAward = coinsForEvent(eventForReward, completionPercentage);

    let xpEarnedToday = profile.xp_earned_today ?? 0;
    const lastXpDate = profile.last_xp_award_date ? new Date(profile.last_xp_award_date) : null;
    if (!lastXpDate || !isTodayUTC(lastXpDate)) {
      xpEarnedToday = 0;
    }
    const xpCapRemaining = Math.max(0, DAILY_XP_CAP - xpEarnedToday);
    xpToAward = Math.min(xpToAward, xpCapRemaining);

    const newXp = (profile.xp ?? 0) + xpToAward;
    const newCoins = (profile.coins ?? 0) + coinsToAward;
    const newWeeklyCoins = (profile.weekly_coins ?? 0) + coinsToAward;
    const newLevel = levelForXP(newXp);
    const now = new Date();

    const completedEventId = crypto.randomUUID();
    await supabase.from("completed_events").insert({
      id: completedEventId,
      user_profile_id: userId,
      completed_at: toISO8601(now),
      completion_percentage: completionPercentage,
      reward_xp: xpToAward,
      reward_coins: coinsToAward,
      created_at: toISO8601(now),
      length: Math.round(eventForReward.length * completionPercentage),
      title: event.title,
      energy_cost: event.energy_cost ?? 0,
      category: event.category ?? "work",
    });

    await supabase
      .from("user_profiles")
      .update({
        xp: newXp,
        level: newLevel,
        coins: newCoins,
        weekly_coins: newWeeklyCoins,
        xp_earned_today: xpEarnedToday + xpToAward,
        last_xp_award_date: toISO8601(now),
        updated_at: toISO8601(now),
      })
      .eq("id", userId);

    if (completionPercentage >= 1.0) {
      await supabase.from("events").delete().eq("id", eventId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        completedEventId,
        rewards: { xp: xpToAward, coins: coinsToAward },
        user: {
          xp: newXp,
          level: newLevel,
          coins: newCoins,
          weekly_coins: newWeeklyCoins,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
