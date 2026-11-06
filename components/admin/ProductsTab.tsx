"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { rand, slugify } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import ProductImage from "@/components/ProductImage";

type Draft = {
  id?: string;
  name: string;
  slug: string;
  category_slug: string;
  description: string;
  price: string;
  stock: string;
  image_url: string | null;
  featured: boolean;
  active: boolean;
};

const blankDraft = (category: string): Draft => ({
  name: "",
  slug: "",
  category_slug: category,
  description: "",
  price: "",
  stock: "0",
  image_url: null,
  featured: false,
  active: true,
});

export default function ProductsTab() {
  const supabase = getBrowserClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p, error: pe }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("category_slug").order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    if (pe) setError(pe.message);
    setProducts((p ?? []) as Product[]);
    setCategories((c ?? []) as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const edit = (p: Product) =>
    setDraft({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category_slug: p.category_slug,
      description: p.description,
      price: (p.price_cents / 100).toFixed(2),
      stock: String(p.stock),
      image_url: p.image_url,
      featured: p.featured,
      active: p.active,
    });

  return (
    <section aria-label="Products">
      <div className="admin-toolbar">
        <p className="muted" style={{ margin: 0 }}>
          {products.length} products. Hidden products don&apos;t show in the store.
        </p>
        <button type="button" className="btn btn-primary btn-small" onClick={() => setDraft(blankDraft(categories[0]?.slug ?? ""))}>
          Add product
        </button>
      </div>
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {loading ? (
        <p className="muted">Loading products…</p>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <span className="sr-only">Photo</span>
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Shown</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <ProductImage src={p.image_url} alt="" className="thumb" />
                  </td>
                  <td>
                    {p.name}
                    {p.featured && (
                      <div className="eyebrow" style={{ fontSize: 11 }}>
                        Featured
                      </div>
                    )}
                  </td>
                  <td>{categories.find((c) => c.slug === p.category_slug)?.name ?? p.category_slug}</td>
                  <td>{rand(p.price_cents)}</td>
                  <td style={{ color: p.stock <= 0 ? "var(--danger)" : p.stock <= 3 ? "var(--warning)" : undefined }}>{p.stock}</td>
                  <td>{p.active ? "Yes" : "Hidden"}</td>
                  <td>
                    <button type="button" className="btn btn-outline btn-small" onClick={() => edit(p)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {draft && (
        <ProductDialog
          draft={draft}
          categories={categories}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            load();
          }}
        />
      )}
    </section>
  );
}

function ProductDialog({
  draft: initial,
  categories,
  onClose,
  onSaved,
}: {
  draft: Draft;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = getBrowserClient();
  const [d, setD] = useState<Draft>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  async function upload(file: File) {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("That photo is bigger than 5 MB. Please use a smaller one.");
      return;
    }
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${slugify(d.name || "product") || "product"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) {
      setError(error.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setD((x) => ({ ...x, image_url: data.publicUrl }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(d.price.replace(/[R\s]/gi, "").replace(",", "."));
    const stock = Number(d.stock);
    const slug = slugify(d.slug || d.name);
    if (!d.name.trim()) return setError("Give the product a name.");
    if (!slug) return setError("The web address can only use letters and numbers.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price, for example 449.00");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number, 0 or more.");
    if (!d.category_slug) return setError("Choose a category.");

    const row = {
      name: d.name.trim(),
      slug,
      category_slug: d.category_slug,
      description: d.description.trim(),
      price_cents: Math.round(price * 100),
      stock,
      image_url: d.image_url,
      featured: d.featured,
      active: d.active,
    };
    setBusy(true);
    const { error } = d.id
      ? await supabase.from("products").update(row).eq("id", d.id)
      : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) {
      setError(error.code === "23505" ? "Another product already uses that web address. Change it slightly." : error.message);
      return;
    }
    onSaved();
  }

  async function remove() {
    if (!d.id) return;
    if (!window.confirm(`Delete "${d.name}" permanently? Past orders keep their copy of the name and price. To just take it off the store, untick "Show in store" instead.`)) return;
    setBusy(true);
    const { error } = await supabase.from("products").delete().eq("id", d.id);
    setBusy(false);
    if (error) setError(error.message);
    else onSaved();
  }

  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
        <h2 id="product-dialog-title">{d.id ? "Edit product" : "Add product"}</h2>
        <form onSubmit={save}>
          <div className="form-grid">
            <div className="field span-2">
              <label htmlFor="p-name">Name</label>
              <input
                id="p-name"
                className="input"
                required
                maxLength={120}
                value={d.name}
                onChange={(e) => setD({ ...d, name: e.target.value, slug: slugTouched ? d.slug : slugify(e.target.value) })}
              />
            </div>
            <div className="field span-2">
              <label htmlFor="p-slug">Web address</label>
              <input
                id="p-slug"
                className="input"
                maxLength={80}
                value={d.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setD({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
                }}
              />
              <span className="hint">/product/{slugify(d.slug || d.name) || "…"}</span>
            </div>
            <div className="field">
              <label htmlFor="p-cat">Category</label>
              <select id="p-cat" className="input" value={d.category_slug} onChange={(e) => setD({ ...d, category_slug: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-price">Price (R)</label>
              <input id="p-price" className="input" required inputMode="decimal" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="p-stock">Stock on hand</label>
              <input id="p-stock" className="input" required inputMode="numeric" value={d.stock} onChange={(e) => setD({ ...d, stock: e.target.value })} />
            </div>
            <div className="field" style={{ justifyContent: "flex-end" }}>
              <label className="check">
                <input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> Show in store
              </label>
              <label className="check">
                <input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} /> Feature on homepage
              </label>
            </div>
            <div className="field span-2">
              <label htmlFor="p-desc">Description</label>
              <textarea id="p-desc" className="input" rows={5} maxLength={4000} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
            </div>
            <div className="field span-2">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Photo</span>
              <div className="image-picker">
                <ProductImage src={d.image_url} alt="" className="thumb" />
                <label className="btn btn-outline btn-small" style={{ cursor: "pointer" }}>
                  {uploading ? "Uploading…" : d.image_url ? "Change photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {d.image_url && (
                  <button type="button" className="link-btn" onClick={() => setD({ ...d, image_url: null })}>
                    Remove photo
                  </button>
                )}
              </div>
              <span className="hint">JPG, PNG or WebP, up to 5 MB. Square photos look best.</span>
            </div>
          </div>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginTop: 16 }}>
              {error}
            </div>
          )}
          <div className="dialog-actions">
            {d.id && (
              <button type="button" className="btn btn-danger" style={{ marginRight: "auto" }} onClick={remove} disabled={busy}>
                Delete
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy || uploading}>
              {busy ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
