"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { useCart } from "./CartContext";

// Refreshes the cart against the database once, and loads the shipping fee.
export function useLiveCart() {
  const cart = useCart();
  const [shipping, setShipping] = useState<number | null>(null);
  const [synced, setSynced] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!cart.ready || started.current) return;
    started.current = true;
    const supabase = getBrowserClient();
    const ids = cart.items.map((i) => i.product_id);
    (async () => {
      const [{ data: settings }, products] = await Promise.all([
        supabase.from("store_settings").select("shipping_cents").eq("id", 1).maybeSingle(),
        ids.length
          ? supabase.from("products").select("id, slug, name, price_cents, image_url, stock").in("id", ids)
          : Promise.resolve({ data: [] as never[], error: null }),
      ]);
      if (products.data && !products.error) cart.sync(products.data);
      setShipping(settings?.shipping_cents ?? 0);
      setSynced(true);
    })();
  }, [cart.ready, cart.items, cart]);

  return { ...cart, shipping, synced };
}
