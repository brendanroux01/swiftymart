import { getServerClient } from "./supabase";
import type { Category, Product } from "./types";

const PRODUCT_FIELDS = "id, slug, name, category_slug, description, price_cents, stock, image_url, featured, active";

export async function getCategories(): Promise<Category[]> {
  const { data } = await getServerClient().from("categories").select("*").order("sort_order");
  return (data ?? []) as Category[];
}

export async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await getServerClient().from("categories").select("*").eq("slug", slug).maybeSingle();
  return (data as Category) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await getServerClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .eq("featured", true)
    .order("created_at")
    .limit(12);
  return (data ?? []) as Product[];
}

export async function getProductsInCategory(slug: string): Promise<Product[]> {
  const { data } = await getServerClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .eq("category_slug", slug)
    .order("name");
  return (data ?? []) as Product[];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await getServerClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product) ?? null;
}

export async function searchProducts(q: string): Promise<Product[]> {
  const term = q.replace(/[%_,()]/g, " ").trim().slice(0, 60);
  if (!term) return [];
  const { data } = await getServerClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("active", true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .order("name")
    .limit(48);
  return (data ?? []) as Product[];
}

export async function getDispatch(productId: string): Promise<{ min_days: number; max_days: number } | null> {
  const { data } = await getServerClient().rpc("product_dispatch", { p_product_id: productId });
  return (data as { min_days: number; max_days: number } | null) ?? null;
}
