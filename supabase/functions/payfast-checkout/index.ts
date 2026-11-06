// Returns the signed PayFast form for a pending order.
// Prices come from the database, never from the browser.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, paramString, PF_MERCHANT_ID, PF_MERCHANT_KEY, PF_PROCESS_URL, signature } from "../_shared/payfast.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function siteOrigin(req: Request): string | null {
  const configured = Deno.env.get("SITE_URL");
  if (configured) return configured.replace(/\/$/, "");
  const origin = req.headers.get("origin") ?? "";
  if (/^https:\/\/[a-z0-9.-]+$/i.test(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { order_id?: string; access_token?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const { order_id, access_token } = body;
  if (!order_id || !access_token || !UUID.test(order_id) || !UUID.test(access_token)) {
    return json({ error: "Invalid order" }, 400);
  }

  const origin = siteOrigin(req);
  if (!origin) return json({ error: "Unknown site" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, access_token, status, customer_name, email, total_cents")
    .eq("id", order_id)
    .eq("access_token", access_token)
    .maybeSingle();
  if (error || !order) return json({ error: "Order not found" }, 404);
  if (order.status !== "pending") return json({ error: "This order has already been processed" }, 409);

  const [first, ...rest] = String(order.customer_name).trim().split(/\s+/);
  const pairs: [string, string][] = [
    ["merchant_id", PF_MERCHANT_ID],
    ["merchant_key", PF_MERCHANT_KEY],
    ["return_url", `${origin}/order/${order.access_token}`],
    ["cancel_url", `${origin}/checkout?cancelled=1`],
    ["notify_url", `${Deno.env.get("SUPABASE_URL")}/functions/v1/payfast-itn`],
    ["name_first", first ?? ""],
    ["name_last", rest.join(" ")],
    ["email_address", order.email],
    ["m_payment_id", order.id],
    ["amount", (order.total_cents / 100).toFixed(2)],
    ["item_name", `SwiftyMart order #${order.order_number}`],
  ];
  const kept = pairs.filter(([, v]) => v.trim() !== "");
  const sig = await signature(paramString(kept, true));
  const fields: Record<string, string> = {};
  for (const [k, v] of kept) fields[k] = v.trim();
  fields.signature = sig;

  return json({ action: PF_PROCESS_URL, fields });
});
