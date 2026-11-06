// PayFast Instant Transaction Notification (ITN) handler.
// An order is only marked paid after: signature matches, PayFast confirms the
// notification is genuine (server-to-server validate), merchant matches, and
// the amount equals the order total stored in the database.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { md5, paramString, pfEncode, PF_MERCHANT_ID, PF_PASSPHRASE, PF_VALIDATE_URL } from "../_shared/payfast.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const all = [...new URLSearchParams(raw).entries()] as [string, string][];
  const sigIndex = all.findIndex(([k]) => k === "signature");
  if (sigIndex < 0) return new Response("Missing signature", { status: 400 });
  const received = all[sigIndex][1];
  const signed = all.slice(0, sigIndex);
  const data = Object.fromEntries(all);

  // 1. Signature (includes empty values, in the order PayFast sent them)
  const base = paramString(signed, false);
  const expected = await md5(PF_PASSPHRASE ? `${base}&passphrase=${pfEncode(PF_PASSPHRASE.trim())}` : base);
  if (expected !== received) {
    console.error("payfast_itn: signature mismatch", data.m_payment_id);
    return new Response("Invalid signature", { status: 400 });
  }

  // 2. Merchant and order id sanity
  if (data.merchant_id !== PF_MERCHANT_ID || !UUID.test(data.m_payment_id ?? "")) {
    console.error("payfast_itn: wrong merchant or order id", data.m_payment_id);
    return new Response("Invalid notification", { status: 400 });
  }

  // 3. Ask PayFast to confirm this notification is genuine
  let verdict = "";
  try {
    const res = await fetch(PF_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: base,
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    verdict = res.ok ? (await res.text()).trim() : `http_${res.status}`;
  } catch (e) {
    console.error("payfast_itn: validate unavailable", String(e));
    return new Response("Validation unavailable", { status: 503 });
  }
  if (verdict !== "VALID") {
    console.error("payfast_itn: validate rejected", verdict.slice(0, 64), data.m_payment_id);
    return new Response("ITN rejected", { status: verdict === "INVALID" ? 400 : 503 });
  }

  // 4. Update the order (amount is checked against the database inside mark_order_paid)
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const status = data.payment_status ?? "";
  if (status === "COMPLETE") {
    const cents = Math.round(parseFloat(data.amount_gross ?? "0") * 100);
    const { data: result, error } = await supabase.rpc("mark_order_paid", {
      p_order_id: data.m_payment_id,
      p_pf_payment_id: data.pf_payment_id ?? "",
      p_amount_cents: cents,
      p_raw_status: status,
    });
    if (error) {
      console.error("payfast_itn: db error", error.message);
      return new Response("Database error", { status: 500 });
    }
    if (result !== "paid") console.error("payfast_itn: not marked paid:", result, data.m_payment_id);
  } else if (status === "CANCELLED" || status === "FAILED") {
    await supabase.rpc("mark_order_failed", {
      p_order_id: data.m_payment_id,
      p_pf_payment_id: data.pf_payment_id ?? "",
      p_raw_status: status,
    });
  }
  return new Response("OK", { status: 200 });
});
