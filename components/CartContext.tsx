"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  quantity: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  sync: (latest: { id: string; slug: string; name: string; price_cents: number; image_url: string | null; stock: number }[]) => void;
};

const STORAGE_KEY = "swiftymart_cart_v1";
export const MAX_QTY = 20;

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* storage unavailable: start with an empty cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const limit = (qty: number, stock: number) => Math.max(1, Math.min(qty, MAX_QTY, Math.max(stock, 1)));

  const add = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, ...item, quantity: limit(i.quantity + qty, item.stock) } : i
        );
      }
      return [...prev, { ...item, quantity: limit(qty, item.stock) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity: limit(qty, i.stock) } : i)));
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  // Refresh names, prices and stock from the database; drop products no longer sold.
  const sync = useCallback(
    (latest: { id: string; slug: string; name: string; price_cents: number; image_url: string | null; stock: number }[]) => {
      setItems((prev) =>
        prev
          .map((i) => {
            const p = latest.find((l) => l.id === i.product_id);
            if (!p || p.stock <= 0) return null;
            return { ...i, slug: p.slug, name: p.name, price_cents: p.price_cents, image_url: p.image_url, stock: p.stock, quantity: limit(i.quantity, p.stock) };
          })
          .filter((i): i is CartItem => i !== null)
      );
    },
    []
  );

  const value = useMemo(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * i.price_cents, 0),
      add,
      setQuantity,
      remove,
      clear,
      sync,
    }),
    [items, ready, add, setQuantity, remove, clear, sync]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
