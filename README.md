# Cortez TCG Live

Minimal One Piece TCG shop for the Bhutanese market: loose packs, raw mint cards, booster boxes, cart, bank-transfer checkout, and a private admin desk — all on free Supabase.

## Stack (free-friendly)

- **Frontend:** Vite + React (this repo root)
- **Backend:** [Supabase](https://supabase.com) free tier (Postgres + Storage + Auth + RLS)
- **Admin:** in-app desk at `#admin` (Supabase Auth email/password) — plus Table Editor if you prefer

```text
src/                 React shop + admin
supabase/
  migrations/        Schema, RLS, create_order, categories
  seed.sql           Base catalog + shipping + payment + streams
.env.example         VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

## One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** — run in order:
   - [`supabase/migrations/20260811120000_init.sql`](supabase/migrations/20260811120000_init.sql)
   - [`supabase/migrations/20260811220000_categories_and_admin.sql`](supabase/migrations/20260811220000_categories_and_admin.sql)  
     (adds `category`, raw/box samples, admin RLS)
   - [`supabase/migrations/20260811230000_admin_delete_policy.sql`](supabase/migrations/20260811230000_admin_delete_policy.sql)
   - [`supabase/migrations/20260811240000_product_meta_and_streams_admin.sql`](supabase/migrations/20260811240000_product_meta_and_streams_admin.sql)  
     (`card_number`, pack details, streams admin write)
   - [`supabase/migrations/20260811250000_stream_schedule.sql`](supabase/migrations/20260811250000_stream_schedule.sql)  
     (stream URL, start/end window, `ended` status)
   - [`supabase/migrations/20260811260000_drop_product_short_name.sql`](supabase/migrations/20260811260000_drop_product_short_name.sql)  
     (single product `name`; drops `short_name`)
   - [`supabase/migrations/20260811270000_product_images_storage.sql`](supabase/migrations/20260811270000_product_images_storage.sql)  
     (public `product-images` bucket for catalog uploads)
   - [`supabase/migrations/20260811280000_stream_urls_array.sql`](supabase/migrations/20260811280000_stream_urls_array.sql)  
     (`stream_urls` JSON array of watch links; replaces `stream_url`)
   - [`supabase/migrations/20260811290000_product_image_placeholder.sql`](supabase/migrations/20260811290000_product_image_placeholder.sql)  
     (legacy `op05`–`op08` image keys → `placeholder`)
   - [`supabase/migrations/20260811300000_home_highlight.sql`](supabase/migrations/20260811300000_home_highlight.sql)  
     (`shop_settings.home_highlight` for the homepage promo card)
   - [`supabase/seed.sql`](supabase/seed.sql)  
     (base catalog + shipping + payment + streams)
3. **Project Settings → API**: copy Project URL + `anon` `public` key into `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. **Create your admin login** (Authentication → Users → Add user):
   - Email + password you will use on the shop desk
   - No special role needed — any authenticated user can manage inventory/orders via RLS
5. Start:
   ```bash
   npm install
   npm run dev
   ```

## Shop categories

One shared `products` table with `category`:

| Category | Shop entry | Optional details |
| --- | --- | --- |
| `loose_pack` | Loose Packs | `product_pack_details` (set code) |
| `raw_card` | Raw Mint Cards | `product_card_details` (set, number, rarity, condition, language) |
| `booster_box` | Booster Boxes | `product_box_details` (packs per box, sealed) |

Optional `compare_at` on products is the base/list price when an item is on sale; checkout always charges `price` (the sale or normal amount).

Same cart / checkout / stock rules for all.

## Admin desk

Open manually:

- Menu → **Admin login**, or
- `http://localhost:5173/#admin`

Then sign in with the Auth user from step 4.

| Tab | What you do |
| --- | --- |
| **Orders** | Search/filter, fee breakdown (subtotal + GST + shipping), open proof, mark status, open **Invoice** (screenshot/print for customer) |
| **Catalog / stock** | Browse/filter list; **Add** / **Edit** on the detail form (upload / replace / remove product image); Unlist/Delete from the table |
| **Streams** | List schedule; **Add** / **Edit** on a dedicated form; Delete from the table |
| **Home** | Edit the homepage highlight card (or hide it) |

Sold-out behavior for customers: stock `0` disables Add (shows **Sold out**). Unlisted items disappear from the catalog.

## Daily ops (without admin UI)

You can still use Supabase Table Editor / Storage for the same tables if you want.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local shop |
| `npm run build` | Production FE build |
| `npm run preview` | Preview built FE |

## Deploy FE (free) — Vercel

Yes: static Vite build on Vercel free tier is enough. Supabase stays where it is; Vercel only hosts the frontend.

1. Push this repo to GitHub (if it isn’t already).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Vite** (or leave defaults). Build: `npm run build`, output: `dist`.
4. **Environment Variables** (same values as `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. You’ll get a `*.vercel.app` URL; custom domain is optional later.

After each push to the connected branch, Vercel rebuilds automatically. Admin stays at `https://your-site.vercel.app/#admin`.

`vercel.json` in the repo already points build/output at Vite’s `dist/`.

