"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase";
import { rand, slugify } from "@/lib/format";
import type { Category, Product, ProductSupplier, Supplier } from "@/lib/types";
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
  supplier_id: string;
  supplier_sku: string;
  cost: string;
};

function parseRand(v: string): number {
  return Number(v.replace(/[R\s]/gi, "").replace(",", "."));
}

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
  supplier_id: "",
  supplier_sku: "",
  cost: "",
});

function ProfitCell({ price, cost }: { price: number; cost: number | null | undefined }) {
  if (cost === null || cost === undefined) return <span className="muted">–</span>;
  const profit = price - cost;
  const pct = price > 0 ? Math.round((profit / price) * 100) : 0;
  return (
    <span className={profit >= 0 ? "profit-pos" : "profit-neg"}>
      {rand(profit)} <span className="muted">({pct}%)</span>
    </span>
  );
}

export default function ProductsTab() {
  const supabase = getBrowserClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [links, setLinks] = useState<ProductSupplier[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p, error: pe }, { data: c }, { data: sup }, { data: l }] = await Promise.all([
      supabase.from("products").select("*").order("category_slug").order("name"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("product_supplier").select("*"),
    ]);
    setSuppliers((sup ?? []) as Supplier[]);
    setLinks((l ?? []) as ProductSupplier[]);
    if (pe) setError(pe.message);
    setProducts((p ?? []) as Product[]);
    setCategories((c ?? []) as Category[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const linkFor = (id: string) => links.find((l) => l.product_id === id);
  const shown = products.filter((p) => {
    if (supplierFilter === "all") return true;
    const sid = linkFor(p.id)?.supplier_id ?? "";
    return supplierFilter === "none" ? !sid : sid === supplierFilter;
  });

  const edit = (p: Product) => {
    const link = linkFor(p.id);
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
      supplier_id: link?.supplier_id ?? "",
      supplier_sku: link?.supplier_sku ?? "",
      cost: link?.cost_cents === null || link?.cost_cents === undefined ? "" : (link.cost_cents / 100).toFixed(2),
    });
  };

  return (
    <section aria-label="Products">
      <div className="admin-toolbar">
        <div className="btn-row">
          <label htmlFor="supplier-filter" className="muted" style={{ fontSize: 14 }}>
            Supplier
          </label>
          <select id="supplier-filter" className="input" style={{ width: "auto", height: 40 }} value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option value="all">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="none">No supplier set</option>
          </select>
          <span className="muted" style={{ fontSize: 14 }}>
            {shown.length} products · hidden products don&apos;t show in the store
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-small"
          onClick={() => setDraft({ ...blankDraft(categories[0]?.slug ?? ""), supplier_id: suppliers.length === 1 ? suppliers[0].id : "" })}
        >
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
                <th>Supplier</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Profit</th>
                <th>Stock</th>
                <th>Shown</th>
                <th>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const link = linkFor(p.id);
                const supplier = suppliers.find((s) => s.id === link?.supplier_id);
                return (
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
                  <td>
                    {supplier ? supplier.name : <span className="warn-text">Not set</span>}
                    {link?.supplier_sku && (
                      <div className="muted" style={{ fontSize: 13 }}>
                        {link.supplier_sku}
                      </div>
                    )}
                  </td>
                  <td>{link?.cost_cents === null || link?.cost_cents === undefined ? <span className="muted">–</span> : rand(link.cost_cents)}</td>
                  <td>{rand(p.price_cents)}</td>
                  <td>
                    <ProfitCell price={p.price_cents} cost={link?.cost_cents} />
                  </td>
                  <td style={{ color: p.stock <= 0 ? "var(--danger)" : p.stock <= 3 ? "var(--warning)" : undefined }}>{p.stock}</td>
                  <td>{p.active ? "Yes" : "Hidden"}</td>
                  <td>
                    <button type="button" className="btn btn-outline btn-small" onClick={() => edit(p)}>
                      Edit
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {draft && (
        <ProductDialog
          draft={draft}
          categories={categories}
          suppliers={suppliers}
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
  suppliers,
  onClose,
  onSaved,
}: {
  draft: Draft;
  categories: Category[];
  suppliers: Supplier[];
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
    const price = parseRand(d.price);
    const cost = d.cost.trim() === "" ? null : parseRand(d.cost);
    const stock = Number(d.stock);
    const slug = slugify(d.slug || d.name);
    if (!d.name.trim()) return setError("Give the product a name.");
    if (!slug) return setError("The web address can only use letters and numbers.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter a valid price, for example 449.00");
    if (!Number.isInteger(stock) || stock < 0) return setError("Stock must be a whole number, 0 or more.");
    if (!d.category_slug) return setError("Choose a category.");
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) return setError("Enter a valid cost price, for example 299.00, or leave it empty.");

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
    let productId = d.id;
    if (d.id) {
      const { error } = await supabase.from("products").update(row).eq("id", d.id);
      if (error) {
        setBusy(false);
        setError(error.code === "23505" ? "Another product already uses that web address. Change it slightly." : error.message);
        return;
      }
    } else {
      const { data, error } = await supabase.from("products").insert(row).select("id").single();
      if (error || !data) {
        setBusy(false);
        setError(error?.code === "23505" ? "Another product already uses that web address. Change it slightly." : error?.message ?? "Could not save.");
        return;
      }
      productId = data.id;
    }
    const { error: linkError } = await supabase.from("product_supplier").upsert({
      product_id: productId,
      supplier_id: d.supplier_id || null,
      supplier_sku: d.supplier_sku.trim(),
      cost_cents: cost === null ? null : Math.round(cost * 100),
      updated_at: new Date().toISOString(),
    });
    setBusy(false);
    if (linkError) {
      setError(`The product was saved, but the supplier details weren't: ${linkError.message}`);
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
              <label htmlFor="p-price">Selling price (R)</label>
              <input id="p-price" className="input" required inputMode="decimal" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="p-supplier">Supplier</label>
              <select id="p-supplier" className="input" value={d.supplier_id} onChange={(e) => setD({ ...d, supplier_id: e.target.value })}>
                <option value="">No supplier set</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.active ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && <span className="hint">Add suppliers on the Suppliers tab first.</span>}
            </div>
            <div className="field">
              <label htmlFor="p-sku">Supplier&apos;s product code</label>
              <input id="p-sku" className="input" maxLength={80} value={d.supplier_sku} onChange={(e) => setD({ ...d, supplier_sku: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="p-cost">Cost price from supplier (R)</label>
              <input id="p-cost" className="input" inputMode="decimal" value={d.cost} onChange={(e) => setD({ ...d, cost: e.target.value })} />
              <span className="hint">Only admins see this.</span>
            </div>
            <div className="field">
              <span style={{ fontSize: 14, fontWeight: 600 }}>Profit per item</span>
              <div style={{ minHeight: 48, display: "flex", alignItems: "center", fontSize: 18, fontWeight: 700 }}>
                {Number.isFinite(parseRand(d.price)) && d.price.trim() !== "" && d.cost.trim() !== "" && Number.isFinite(parseRand(d.cost)) ? (
                  <ProfitCell price={Math.round(parseRand(d.price) * 100)} cost={Math.round(parseRand(d.cost) * 100)} />
                ) : (
                  <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>Enter the price and cost to see it</span>
                )}
              </div>
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
