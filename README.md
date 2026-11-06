# SwiftyMart

Online store for tech accessories, backup power and gaming gear.
Next.js (App Router) + Supabase, payments by PayFast, delivery by The Courier Guy.

**Status: test site.** Payments go to the PayFast **sandbox** – no real money moves.

## What's here

| Area | Where |
|---|---|
| Storefront: home, categories, product pages, search | `app/` |
| Cart (saved in the browser) and checkout | `app/cart`, `app/checkout` |
| Order status page for customers (private link) | `app/order/[token]` |
| Admin: orders, products with photos, delivery fee | `app/admin`, `components/admin` |
| PayFast checkout signing and payment confirmation (ITN) | `supabase/functions` |

## Suppliers (reseller setup)

SwiftyMart resells products from suppliers who deliver straight to the customer.

- **Suppliers tab:** supplier details and usual dispatch time. Customers only ever see "Usually dispatched within X–Y working days", never the supplier.
- **Products:** each product can be linked to a supplier, with the supplier's product code and the cost price. Admin shows the profit per item. Supplier links and cost prices live in `product_supplier`, which only admins can read.
- **To order tab:** paid orders waiting to be ordered, with a pre-filled email to the supplier (items, codes, and the customer's delivery address). Then "Mark as ordered".
- **Order steps:** Paid → Ordered from supplier → Shipped (with the tracking number from the supplier). Each order line keeps the cost at the time of sale, so profit per order stays accurate.

## How payment works

1. Checkout calls the database function `create_order`. Prices and stock come from the database, never the browser.
2. The `payfast-checkout` edge function signs the order and sends the customer to PayFast.
3. PayFast notifies the `payfast-itn` edge function. The order is marked **paid** only after the signature matches, PayFast confirms the notification is genuine, and the amount equals the order total. Stock is reduced at that point.

## Deploying (Vercel)

Import this repo in Vercel. No environment variables are needed: the Supabase URL and
publishable key are public by design and built in (`lib/supabase.ts`). Data access is
controlled by the database security rules.

## Supabase settings to check

- **Authentication → Sign In / Providers → Email → turn off "Confirm email".** Admin
  access is already approved by hand, and Supabase's built-in email sender only allows a few emails an hour.
- **Authentication → URL Configuration → Site URL:** set it to the Vercel link.

## Making someone an admin

They create an account at `/admin`, then run in the Supabase SQL editor:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'their@email.com';
```

## Going live with PayFast

Set these edge function secrets in Supabase (Edge Functions → Secrets), using the merchant's own PayFast details:

- `PAYFAST_MODE` = `live`
- `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`
- `SITE_URL` = the store's final web address

Then remove the test banner in `components/Header.tsx`, and remove `robots: { index: false }` in `app/layout.tsx`.
