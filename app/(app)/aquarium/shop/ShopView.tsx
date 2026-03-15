"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SHOP_CATALOG, SHOP_CATEGORIES, type ShopCatalogItem } from "@/lib/shop-catalog";

export function ShopView({ userCoins: initialCoins }: { userCoins: number }) {
  const router = useRouter();
  const [category, setCategory] = useState<"fish" | "accessory" | "tank">("fish");
  const [coins, setCoins] = useState(initialCoins);
  const [confirmItem, setConfirmItem] = useState<ShopCatalogItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const items = SHOP_CATALOG.filter((i) => i.type === category);

  async function handlePurchase(item: ShopCatalogItem) {
    setConfirmItem(null);
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessage({ type: "error", text: "Not signed in." });
        return;
      }
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/shop-purchase`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ itemKey: item.itemKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error === "Insufficient funds" ? `You need ${data.needed ?? item.price} more coins.` : data.error ?? "Purchase failed.",
        });
        return;
      }
      setCoins(data.user?.coins ?? coins - item.price);
      setMessage({ type: "success", text: `You bought ${item.name}!` });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Purchase failed. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" data-tour="shop">
      <div className="flex items-center justify-between">
        <Link
          href="/aquarium"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Aquarium
        </Link>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
          <span aria-hidden>🪙</span>
          <span className="font-semibold text-gray-900">{coins}</span>
          <span className="text-gray-500 text-sm">coins</span>
        </div>
      </div>
      <h1 className="text-xl font-semibold text-gray-900">Aquarium Shop</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {SHOP_CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              category === c.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.itemKey}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex h-20 items-center justify-center rounded-lg bg-gray-100 text-4xl">
              {item.type === "fish" ? "🐠" : item.type === "tank" ? "🫙" : "🪸"}
            </div>
            <h3 className="mt-2 font-medium text-gray-900">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
            <p className="mt-1 text-sm font-semibold text-indigo-600">{item.price} coins</p>
            <button
              type="button"
              onClick={() => setConfirmItem(item)}
              disabled={loading || coins < item.price}
              className="mt-3 w-full rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      {confirmItem && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Confirm purchase</h3>
            <p className="mt-1 text-gray-600">
              Buy {confirmItem.name} for {confirmItem.price} coins?
            </p>
            <p className="text-sm text-gray-500">You have {coins} coins.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                className="flex-1 rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePurchase(confirmItem)}
                disabled={loading}
                className="flex-1 rounded-md bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Buying…" : "Buy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
