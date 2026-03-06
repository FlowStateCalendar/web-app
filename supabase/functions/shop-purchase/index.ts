/**
 * Supabase Edge Function: shop-purchase
 *
 * Validates and applies a shop purchase: deduct user coins, add fish/accessory/tank to aquarium.
 * Call from web (or iOS) so purchases are enforced server-side.
 *
 * POST /functions/v1/shop-purchase
 * Body: { "itemKey": "tropical_fish" }  (see catalog.ts for keys)
 * Auth: Bearer <user JWT>
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCatalogItem } from "./catalog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function newUUID(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
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

    let body: { itemKey?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const itemKey = body.itemKey;
    if (!itemKey || typeof itemKey !== "string") {
      return new Response(
        JSON.stringify({ error: "itemKey (string) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const item = getCatalogItem(itemKey);
    if (!item) {
      return new Response(
        JSON.stringify({ error: "Unknown item key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, coins")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentCoins = profile.coins ?? 0;
    if (currentCoins < item.price) {
      return new Response(
        JSON.stringify({ error: "Insufficient funds", needed: item.price - currentCoins }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: aquarium, error: aquariumError } = await supabase
      .from("aquariums")
      .select("id, fish, accessories, owned_tanks, tank_type, clean_level")
      .eq("user_profile_id", userId)
      .single();

    if (aquariumError || !aquarium) {
      return new Response(
        JSON.stringify({ error: "Aquarium not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (item.type === "tank" && item.tankType) {
      const owned: string[] = Array.isArray(aquarium.owned_tanks) ? aquarium.owned_tanks : [];
      if (owned.includes(item.tankType)) {
        return new Response(
          JSON.stringify({ error: "Already owned" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const newCoins = currentCoins - item.price;
    let fishJson = aquarium.fish;
    let accessoriesJson = aquarium.accessories;
    let ownedTanks: string[] = Array.isArray(aquarium.owned_tanks) ? [...aquarium.owned_tanks] : [];

    if (item.type === "fish") {
      const fishList: unknown[] = typeof fishJson === "string" ? (JSON.parse(fishJson || "[]") as unknown[]) : (fishJson as unknown[]);
      const newFish = {
        id: newUUID(),
        name: item.name,
        size: "Medium",
        image: item.image,
        health: 5,
        happiness: 100,
        lastFed: null,
        customName: null,
        isSelected: false,
        lastInteraction: null,
        position: { x: 0, y: 0 },
        movementState: "idle",
        behavior: {},
        depth: "middle",
        zIndex: 0,
        collisionRadius: 15,
        isMoving: false,
      };
      fishList.push(newFish);
      fishJson = JSON.stringify(fishList);
    } else if (item.type === "accessory") {
      const accList: unknown[] = typeof accessoriesJson === "string" ? (JSON.parse(accessoriesJson || "[]") as unknown[]) : (accessoriesJson as unknown[]);
      const newAcc = {
        id: newUUID(),
        name: item.name,
        type: item.description,
        position: null,
        isActive: true,
      };
      accList.push(newAcc);
      accessoriesJson = JSON.stringify(accList);
    } else if (item.type === "tank" && item.tankType) {
      if (!ownedTanks.includes(item.tankType)) {
        ownedTanks.push(item.tankType);
      }
    }

    await supabase
      .from("user_profiles")
      .update({ coins: newCoins, updated_at: nowISO() })
      .eq("id", userId);

    await supabase
      .from("aquariums")
      .update({
        fish: fishJson,
        accessories: accessoriesJson,
        owned_tanks: ownedTanks,
        tank_type: item.type === "tank" && item.tankType ? item.tankType : aquarium.tank_type,
        updated_at: nowISO(),
      })
      .eq("id", aquarium.id);

    return new Response(
      JSON.stringify({
        ok: true,
        itemKey: item.itemKey,
        name: item.name,
        newCoins,
        user: { coins: newCoins },
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
