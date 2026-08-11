import type { BankAccount } from "../data/payment";
import {
  products as fallbackProducts,
  type Product,
  type ProductBadge,
  type ProductCategory,
} from "../data/products";
import { paymentAccounts as fallbackAccounts } from "../data/payment";
import {
  shippingZones as fallbackZones,
  type ShippingZone,
  type ShippingZoneId,
} from "../data/shipping";
import { streams as fallbackStreams, type StreamEvent } from "../data/streams";
import { GST_RATE } from "./money";
import { resolveProductImage } from "./productImages";
import {
  DEFAULT_HOME_HIGHLIGHT,
  parseHomeHighlight,
  type HomeHighlight,
} from "./homeHighlight";
import { parseStreamUrls } from "./streamLinks";
import { sortStreamsByPriority } from "./streamSchedule";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import localPaymentQr from "../assets/payment-qr.png";

export type ShopSettings = {
  shopName: string;
  gstRate: number;
  paymentAccounts: BankAccount[];
  paymentQrUrl: string;
  homeHighlight: HomeHighlight;
};

export type ShopCatalog = {
  products: Product[];
  streams: StreamEvent[];
  shippingZones: ShippingZone[];
  settings: ShopSettings;
  source: "supabase" | "local";
};

export type CreateOrderInput = {
  fullName: string;
  phone: string;
  address: string;
  zoneId: ShippingZoneId;
  notes: string;
  paymentReference: string;
  proofFile: File;
  items: { productId: string; quantity: number }[];
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  compare_at: number | null;
  image_url: string;
  badge: ProductBadge | null;
  stock: number;
  category?: ProductCategory | null;
  is_active?: boolean;
  product_card_details?:
    | {
        set_code: string | null;
        card_number: string | null;
        rarity: string | null;
        condition: string | null;
        language: string | null;
      }
    | {
        set_code: string | null;
        card_number: string | null;
        rarity: string | null;
        condition: string | null;
        language: string | null;
      }[]
    | null;
  product_box_details?:
    | {
        packs_per_box: number | null;
        sealed: boolean | null;
      }
    | {
        packs_per_box: number | null;
        sealed: boolean | null;
      }[]
    | null;
  product_pack_details?:
    | {
        set_code: string | null;
      }
    | {
        set_code: string | null;
      }[]
    | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type StreamRow = {
  id: string;
  title: string;
  day: string;
  time: string;
  focus: string;
  status: StreamEvent["status"];
  sort_order?: number;
  stream_urls?: unknown;
  stream_url?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type ShippingRow = {
  id: string;
  label: string;
  detail: string;
  fee: number;
};

type SettingsRow = {
  shop_name: string;
  gst_rate: number;
  payment_accounts: BankAccount[];
  payment_qr_url: string | null;
  home_highlight?: unknown;
};

function mapProduct(row: ProductRow): Product {
  const card = firstRelation(row.product_card_details);
  const box = firstRelation(row.product_box_details);
  const pack = firstRelation(row.product_pack_details);
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    compareAt: row.compare_at ?? undefined,
    image: resolveProductImage(row.image_url),
    badge: row.badge ?? undefined,
    category: row.category ?? "loose_pack",
    stock: row.stock,
    isActive: row.is_active ?? true,
    cardDetails: card
      ? {
          setCode: card.set_code ?? undefined,
          cardNumber: card.card_number ?? undefined,
          rarity: card.rarity ?? undefined,
          condition: card.condition ?? undefined,
          language: card.language ?? undefined,
        }
      : undefined,
    boxDetails: box
      ? {
          packsPerBox: box.packs_per_box ?? undefined,
          sealed: box.sealed ?? undefined,
        }
      : undefined,
    packDetails: pack
      ? {
          setCode: pack.set_code ?? undefined,
        }
      : undefined,
  };
}

function localCatalog(): ShopCatalog {
  return {
    products: fallbackProducts.map((product) => ({
      ...product,
      stock: product.stock ?? 99,
      isActive: product.isActive ?? true,
      category: product.category ?? "loose_pack",
    })),
    streams: sortStreamsByPriority(fallbackStreams),
    shippingZones: fallbackZones,
    settings: {
      shopName: "Cortez TCG Live",
      gstRate: GST_RATE,
      paymentAccounts: fallbackAccounts,
      paymentQrUrl: localPaymentQr,
      homeHighlight: { ...DEFAULT_HOME_HIGHLIGHT },
    },
    source: "local",
  };
}

const productSelectWithCategory =
  "id, name, price, compare_at, image_url, badge, stock, category, is_active, product_card_details(set_code, card_number, rarity, condition, language), product_box_details(packs_per_box, sealed), product_pack_details(set_code)";

const productSelectLegacy =
  "id, name, price, compare_at, image_url, badge, stock";

const productSelectCategoryNoPack =
  "id, name, price, compare_at, image_url, badge, stock, category, is_active, product_card_details(set_code, rarity, condition, language), product_box_details(packs_per_box, sealed)";

export async function loadShopCatalog(): Promise<ShopCatalog> {
  if (!isSupabaseConfigured) {
    return localCatalog();
  }

  const supabase = getSupabase();

  let productRows: ProductRow[] = [];

  const richProducts = await supabase
    .from("products")
    .select(productSelectWithCategory)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (richProducts.error) {
    const midProducts = await supabase
      .from("products")
      .select(productSelectCategoryNoPack)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (midProducts.error) {
      const legacyProducts = await supabase
        .from("products")
        .select(productSelectLegacy)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (legacyProducts.error) throw legacyProducts.error;
      productRows = (legacyProducts.data ?? []) as unknown as ProductRow[];
    } else {
      productRows = (midProducts.data ?? []) as unknown as ProductRow[];
    }
  } else {
    productRows = (richProducts.data ?? []) as unknown as ProductRow[];
  }

  let settingsRes = await supabase
    .from("shop_settings")
    .select("shop_name, gst_rate, payment_accounts, payment_qr_url, home_highlight")
    .eq("id", "default")
    .maybeSingle();

  if (settingsRes.error?.message.includes("home_highlight")) {
    settingsRes = await supabase
      .from("shop_settings")
      .select("shop_name, gst_rate, payment_accounts, payment_qr_url")
      .eq("id", "default")
      .maybeSingle();
  }

  const [streamsRes, zonesRes] = await Promise.all([
    supabase
      .from("streams")
      .select(
        "id, title, day, time, focus, status, sort_order, stream_urls, starts_at, ends_at",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("shipping_zones")
      .select("id, label, detail, fee")
      .order("sort_order", { ascending: true }),
  ]);

  let streamRows: StreamRow[] = [];
  if (streamsRes.error) {
    const midStreams = await supabase
      .from("streams")
      .select(
        "id, title, day, time, focus, status, sort_order, stream_url, starts_at, ends_at",
      )
      .order("sort_order", { ascending: true });
    if (midStreams.error) {
      const legacyStreams = await supabase
        .from("streams")
        .select("id, title, day, time, focus, status, sort_order")
        .order("sort_order", { ascending: true });
      if (legacyStreams.error) throw legacyStreams.error;
      streamRows = (legacyStreams.data ?? []) as StreamRow[];
    } else {
      streamRows = (midStreams.data ?? []) as StreamRow[];
    }
  } else {
    streamRows = (streamsRes.data ?? []) as StreamRow[];
  }

  if (zonesRes.error) throw zonesRes.error;
  if (settingsRes.error) throw settingsRes.error;

  const settingsRow = settingsRes.data as SettingsRow | null;
  const products = productRows.map(mapProduct);
  const streams = sortStreamsByPriority(
    streamRows.map((stream) => ({
      id: stream.id,
      title: stream.title,
      day: stream.day,
      time: stream.time,
      focus: stream.focus,
      status: stream.status,
      sortOrder: stream.sort_order ?? 0,
      streamUrls: parseStreamUrls(stream.stream_urls, stream.stream_url),
      startsAt: stream.starts_at ?? undefined,
      endsAt: stream.ends_at ?? undefined,
    })),
  );
  const shippingZones = ((zonesRes.data ?? []) as ShippingRow[]).map(
    (zone) =>
      ({
        id: zone.id as ShippingZoneId,
        label: zone.label,
        detail: zone.detail,
        fee: zone.fee,
      }) satisfies ShippingZone,
  );

  if (products.length === 0 || shippingZones.length === 0 || !settingsRow) {
    return localCatalog();
  }

  return {
    products,
    streams,
    shippingZones,
    settings: {
      shopName: settingsRow.shop_name,
      gstRate: Number(settingsRow.gst_rate),
      paymentAccounts: settingsRow.payment_accounts ?? fallbackAccounts,
      paymentQrUrl: settingsRow.payment_qr_url || localPaymentQr,
      homeHighlight: parseHomeHighlight(settingsRow.home_highlight),
    },
    source: "supabase",
  };
}

export async function uploadPaymentProof(file: File): Promise<string> {
  const supabase = getSupabase();
  const draftId = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  const path = `${draftId}/proof.${safeExt}`;

  const { error } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${safeExt}`,
    });

  if (error) throw error;
  return path;
}

export async function submitOrder(input: CreateOrderInput): Promise<string> {
  if (!isSupabaseConfigured) {
    const stamp = Date.now().toString(36).toUpperCase().slice(-6);
    const rand = Math.floor(Math.random() * 90 + 10);
    return `CTL-${stamp}${rand}`;
  }

  const proofPath = await uploadPaymentProof(input.proofFile);
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("create_order", {
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_address: input.address,
    p_zone_id: input.zoneId,
    p_notes: input.notes,
    p_payment_reference: input.paymentReference,
    p_proof_path: proofPath,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) throw error;
  if (!data || typeof data !== "string") {
    throw new Error("Order was not created");
  }
  return data;
}
