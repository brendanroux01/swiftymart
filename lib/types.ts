export type Category = {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  description: string;
  price_cents: number;
  stock: number;
  image_url: string | null;
  featured: boolean;
  active: boolean;
};

export type OrderItem = {
  id: string;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

export type Order = {
  id: string;
  order_number: number;
  status: "pending" | "paid" | "shipped" | "cancelled" | "failed";
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  notes: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  payfast_payment_id: string | null;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  order_items: OrderItem[];
};

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];
