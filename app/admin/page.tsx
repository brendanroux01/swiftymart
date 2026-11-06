"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";
import AdminLogin from "@/components/admin/AdminLogin";
import OrdersTab from "@/components/admin/OrdersTab";
import ProductsTab from "@/components/admin/ProductsTab";
import SettingsTab from "@/components/admin/SettingsTab";

type Tab = "orders" | "products" | "settings";

export default function AdminPage() {
  const supabase = getBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("orders");

  const checkAdmin = useCallback(
    async (s: Session | null) => {
      setSession(s);
      if (!s) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }
      const { data } = await supabase.from("admins").select("user_id").eq("user_id", s.user.id).maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
    },
    [supabase]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => checkAdmin(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setChecking(true);
      // Run outside the auth callback to avoid blocking the client.
      window.setTimeout(() => checkAdmin(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, checkAdmin]);

  if (checking) {
    return (
      <div className="container page">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!session) return <AdminLogin />;

  if (!isAdmin) {
    return (
      <div className="container page">
        <h1 className="page-title">Waiting for approval</h1>
        <p className="muted">
          You&apos;re signed in as {session.user.email}, but this account hasn&apos;t been given admin access yet. Ask the store
          owner to approve it.
        </p>
        <button type="button" className="btn btn-outline" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="admin-toolbar">
        <h1 className="page-title" style={{ margin: 0 }}>
          Store admin
        </h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="muted" style={{ fontSize: 14 }}>
            {session.user.email}
          </span>
          <button type="button" className="btn btn-outline btn-small" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {(["orders", "products", "settings"] as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === "orders" ? "Orders" : t === "products" ? "Products" : "Settings"}
          </button>
        ))}
      </div>
      {tab === "orders" && <OrdersTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
