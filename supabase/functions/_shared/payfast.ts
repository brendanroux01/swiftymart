import { crypto } from "jsr:@std/crypto@1";
import { encodeHex } from "jsr:@std/encoding@1/hex";

// Sandbox values are PayFast's public test account. For the live store, set
// PAYFAST_MODE=live and the merchant's own PAYFAST_MERCHANT_ID,
// PAYFAST_MERCHANT_KEY and PAYFAST_PASSPHRASE as edge function secrets.
export const PF_MODE = Deno.env.get("PAYFAST_MODE") === "live" ? "live" : "sandbox";
export const PF_MERCHANT_ID = Deno.env.get("PAYFAST_MERCHANT_ID") ?? "10000100";
export const PF_MERCHANT_KEY = Deno.env.get("PAYFAST_MERCHANT_KEY") ?? "46f0cd694581a";
export const PF_PASSPHRASE = Deno.env.get("PAYFAST_PASSPHRASE") ?? (PF_MODE === "sandbox" ? "jt7NOE43FZPn" : "");

const PF_HOST = PF_MODE === "live" ? "https://www.payfast.co.za" : "https://sandbox.payfast.co.za";
export const PF_PROCESS_URL = `${PF_HOST}/eng/process`;
export const PF_VALIDATE_URL = `${PF_HOST}/eng/query/validate`;

// Same encoding as PHP urlencode(): spaces as +, uppercase hex.
export function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

export async function md5(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("MD5", new TextEncoder().encode(text));
  return encodeHex(digest);
}

// Builds "key=value&key=value" from ordered pairs, skipping empty values.
export function paramString(pairs: [string, string][], skipEmpty: boolean): string {
  return pairs
    .filter(([, v]) => !skipEmpty || v.trim() !== "")
    .map(([k, v]) => `${k}=${pfEncode(v.trim())}`)
    .join("&");
}

export async function signature(base: string): Promise<string> {
  const withPass = PF_PASSPHRASE ? `${base}&passphrase=${pfEncode(PF_PASSPHRASE.trim())}` : base;
  return await md5(withPass);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
