import { getSupabase, isSupabaseConfigured } from "./supabase";
import {
  PLACEHOLDER_PRODUCT_IMAGE_KEY,
  PRODUCT_IMAGES_BUCKET,
  productImagePathFromUrl,
  resolveProductImage,
} from "./productImages";
import type {
  Product,
  ProductBadge,
  ProductBoxDetails,
  ProductCardDetails,
  ProductCategory,
  ProductPackDetails,
} from "../data/products";
import type { StreamEvent, StreamStatus } from "../data/streams";
import {
  parseHomeHighlight,
  type HomeHighlight,
} from "./homeHighlight";
import { formatNu } from "./money";
import { normalizeStreamUrls, parseStreamUrls } from "./streamLinks";
import { resolveStreamStatus } from "./streamSchedule";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "packed"
  | "shipped"
  | "cancelled";

export type AdminOrderItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type AdminOrder = {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  zoneId: string;
  zoneLabel: string;
  notes: string;
  paymentReference: string;
  proofPath: string;
  subtotal: number;
  gst: number;
  gstRate: number;
  shippingFee: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: string;
  items: AdminOrderItem[];
};

export type AdminProduct = Product & {
  isActive: boolean;
  stock: number;
  /** Raw DB `image_url` (public storage URL or legacy asset key). */
  imageUrl: string;
};

export type AdminProductPatch = {
  stock?: number;
  price?: number;
  compareAt?: number | null;
  isActive?: boolean;
  name?: string;
  badge?: ProductBadge | null;
  imageUrl?: string;
  cardDetails?: ProductCardDetails | null;
  boxDetails?: ProductBoxDetails | null;
  packDetails?: ProductPackDetails | null;
};

export type AdminProductCreate = {
  id?: string;
  name: string;
  category: ProductCategory;
  price: number;
  compareAt?: number | null;
  stock: number;
  isActive?: boolean;
  /** Existing URL/key; ignored when `imageFile` is set. */
  imageUrl?: string;
  imageFile?: File | null;
  badge?: ProductBadge | null;
  sortOrder?: number;
  cardDetails?: ProductCardDetails | null;
  boxDetails?: ProductBoxDetails | null;
  packDetails?: ProductPackDetails | null;
};

export type AdminStream = StreamEvent & {
  sortOrder: number;
};

export type AdminStreamInput = {
  id?: string;
  title: string;
  day: string;
  time: string;
  focus: string;
  status: StreamStatus;
  sortOrder?: number;
  streamUrls?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

function slugifyProductId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function assertProductImageFile(file: File) {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  const type = file.type || "";
  if (type && !ALLOWED_IMAGE_TYPES.has(type)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }
}

function imageExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

/** Upload a product image; returns a public HTTPS URL stored in `products.image_url`. */
export async function uploadProductImage(productId: string, file: File) {
  assertProductImageFile(file);
  const supabase = getSupabase();
  const ext = imageExtension(file);
  const path = `${productId}/cover-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || `image/${ext}`,
    });
  if (error) throw error;

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

/** Delete a file from the product-images bucket when `imageUrl` points there. */
export async function removeProductStorageImage(
  imageUrl: string | null | undefined,
) {
  const path = productImagePathFromUrl(imageUrl);
  if (!path) return;
  const { error } = await getSupabase()
    .storage.from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);
  if (error) throw error;
}

/** Replace or clear a product image; returns the next raw `image_url` value. */
export async function setAdminProductImage(
  productId: string,
  options: {
    file?: File | null;
    clear?: boolean;
    previousUrl?: string | null;
  },
) {
  const previous = options.previousUrl ?? null;

  if (options.clear) {
    await removeProductStorageImage(previous);
    return PLACEHOLDER_PRODUCT_IMAGE_KEY;
  }

  if (options.file) {
    const nextUrl = await uploadProductImage(productId, options.file);
    if (previous && previous !== nextUrl) {
      try {
        await removeProductStorageImage(previous);
      } catch {
        /* keep new image even if old cleanup fails */
      }
    }
    return nextUrl;
  }

  return previous?.trim() || PLACEHOLDER_PRODUCT_IMAGE_KEY;
}

export async function adminSignIn(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function adminSignOut() {
  if (!isSupabaseConfigured) return;
  await getSupabase().auth.signOut();
}

export async function getAdminSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export async function loadAdminProducts(): Promise<AdminProduct[]> {
  const supabase = getSupabase();
  const rich = await supabase
    .from("products")
    .select(
      "id, name, price, compare_at, image_url, badge, stock, category, is_active, sort_order, product_card_details(set_code, card_number, rarity, condition, language), product_box_details(packs_per_box, sealed), product_pack_details(set_code)",
    )
    .order("sort_order", { ascending: true });

  const { data, error } = rich.error
    ? await supabase
        .from("products")
        .select(
          "id, name, price, compare_at, image_url, badge, stock, category, is_active, sort_order, product_card_details(set_code, rarity, condition, language), product_box_details(packs_per_box, sealed)",
        )
        .order("sort_order", { ascending: true })
    : rich;

  if (error) throw error;

  return (data ?? []).map((row) => {
    const card = firstRelation(
      row.product_card_details as
        | {
            set_code: string | null;
            card_number?: string | null;
            rarity: string | null;
            condition: string | null;
            language: string | null;
          }
        | {
            set_code: string | null;
            card_number?: string | null;
            rarity: string | null;
            condition: string | null;
            language: string | null;
          }[]
        | null,
    );
    const box = firstRelation(
      row.product_box_details as
        | { packs_per_box: number | null; sealed: boolean | null }
        | { packs_per_box: number | null; sealed: boolean | null }[]
        | null,
    );
    const pack = firstRelation(
      (row as { product_pack_details?: { set_code: string | null } | { set_code: string | null }[] | null })
        .product_pack_details,
    );

    return {
      id: row.id as string,
      name: row.name as string,
      price: row.price as number,
      compareAt: (row.compare_at as number | null) ?? undefined,
      imageUrl: row.image_url as string,
      image: resolveProductImage(row.image_url as string),
      badge: (row.badge as Product["badge"]) ?? undefined,
      category: (row.category as ProductCategory) ?? "loose_pack",
      stock: row.stock as number,
      isActive: Boolean(row.is_active),
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
  });
}

export async function updateAdminProduct(id: string, patch: AdminProductPatch) {
  const supabase = getSupabase();
  const payload: Record<string, string | number | boolean | null> = {};
  if (patch.stock != null) payload.stock = Math.max(0, Math.round(patch.stock));
  if (patch.price != null) payload.price = Math.max(0, Math.round(patch.price));
  if (patch.compareAt !== undefined) {
    payload.compare_at =
      patch.compareAt == null
        ? null
        : Math.max(0, Math.round(patch.compareAt));
  }
  if (patch.isActive != null) payload.is_active = patch.isActive;
  if (patch.name != null) payload.name = patch.name.trim();
  if (patch.imageUrl != null) payload.image_url = patch.imageUrl.trim();
  if (patch.badge !== undefined) payload.badge = patch.badge;

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
  }

  if (patch.cardDetails !== undefined) {
    if (patch.cardDetails == null) {
      const { error } = await supabase
        .from("product_card_details")
        .delete()
        .eq("product_id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("product_card_details").upsert({
        product_id: id,
        set_code: emptyToNull(patch.cardDetails.setCode),
        card_number: emptyToNull(patch.cardDetails.cardNumber),
        rarity: emptyToNull(patch.cardDetails.rarity),
        condition: emptyToNull(patch.cardDetails.condition) ?? "NM",
        language: emptyToNull(patch.cardDetails.language) ?? "EN",
      });
      if (error) throw error;
    }
  }

  if (patch.boxDetails !== undefined) {
    if (patch.boxDetails == null) {
      const { error } = await supabase
        .from("product_box_details")
        .delete()
        .eq("product_id", id);
      if (error) throw error;
    } else {
      const packs =
        patch.boxDetails.packsPerBox != null &&
        Number.isFinite(patch.boxDetails.packsPerBox)
          ? Math.max(1, Math.round(patch.boxDetails.packsPerBox))
          : null;
      const { error } = await supabase.from("product_box_details").upsert({
        product_id: id,
        packs_per_box: packs,
        sealed: patch.boxDetails.sealed ?? true,
      });
      if (error) throw error;
    }
  }

  if (patch.packDetails !== undefined) {
    if (patch.packDetails == null || !emptyToNull(patch.packDetails.setCode)) {
      const { error } = await supabase
        .from("product_pack_details")
        .delete()
        .eq("product_id", id);
      if (error && !error.message.includes("does not exist")) throw error;
    } else {
      const { error } = await supabase.from("product_pack_details").upsert({
        product_id: id,
        set_code: emptyToNull(patch.packDetails.setCode),
      });
      if (error) throw error;
    }
  }
}

export async function createAdminProduct(input: AdminProductCreate) {
  const supabase = getSupabase();
  const name = input.name.trim();
  const id =
    input.id?.trim() ||
    slugifyProductId(name) ||
    `sku-${Date.now().toString(36)}`;

  let imageUrl =
    input.imageUrl?.trim() || PLACEHOLDER_PRODUCT_IMAGE_KEY;
  if (input.imageFile) {
    imageUrl = await setAdminProductImage(id, {
      file: input.imageFile,
      previousUrl: null,
    });
  }

  const { error } = await supabase.from("products").insert({
    id,
    name,
    price: Math.max(0, Math.round(input.price)),
    compare_at:
      input.compareAt == null ? null : Math.max(0, Math.round(input.compareAt)),
    image_url: imageUrl,
    badge: input.badge ?? null,
    stock: Math.max(0, Math.round(input.stock)),
    is_active: input.isActive ?? true,
    sort_order: input.sortOrder ?? 500,
    category: input.category,
  });

  if (error) {
    if (input.imageFile) {
      try {
        await removeProductStorageImage(imageUrl);
      } catch {
        /* ignore rollback cleanup */
      }
    }
    throw new Error(
      error.message.includes("duplicate")
        ? `SKU “${id}” already exists. Change the name or id.`
        : error.message,
    );
  }

  await updateAdminProduct(id, {
    cardDetails:
      input.category === "raw_card" ? (input.cardDetails ?? {}) : undefined,
    boxDetails:
      input.category === "booster_box" ? (input.boxDetails ?? {}) : undefined,
    packDetails:
      input.category === "loose_pack"
        ? (input.packDetails ?? null)
        : undefined,
  });

  return id;
}

/** Soft list/unlist from shop, or hard delete when never ordered. */
export async function deleteAdminProduct(
  id: string,
  mode: "list" | "unlist" | "hard",
) {
  const supabase = getSupabase();
  if (mode === "unlist") {
    const { error } = await supabase
      .from("products")
      .update({ is_active: false, stock: 0 })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  if (mode === "list") {
    const { error } = await supabase
      .from("products")
      .update({ is_active: true })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    throw new Error(
      error.message.includes("foreign key")
        ? "This item appears on past orders. Unlist it instead of deleting."
        : error.message,
    );
  }

  try {
    const { data: files } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .list(id);
    if (files && files.length > 0) {
      await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove(files.map((file) => `${id}/${file.name}`));
    }
  } catch {
    /* product row is already gone */
  }
}

export async function loadAdminStreams(): Promise<AdminStream[]> {
  const rich = await getSupabase()
    .from("streams")
    .select(
      "id, title, day, time, focus, status, sort_order, stream_urls, starts_at, ends_at",
    )
    .order("sort_order", { ascending: true });

  const withLegacyUrl = rich.error
    ? await getSupabase()
        .from("streams")
        .select(
          "id, title, day, time, focus, status, sort_order, stream_url, starts_at, ends_at",
        )
        .order("sort_order", { ascending: true })
    : null;

  const legacy = withLegacyUrl?.error
    ? await getSupabase()
        .from("streams")
        .select("id, title, day, time, focus, status, sort_order")
        .order("sort_order", { ascending: true })
    : null;

  const { data, error } = rich.error
    ? withLegacyUrl?.error
      ? legacy!
      : withLegacyUrl!
    : rich;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const raw = row as {
      stream_urls?: unknown;
      stream_url?: string | null;
      starts_at?: string | null;
      ends_at?: string | null;
    };
    const base: AdminStream = {
      id: row.id as string,
      title: row.title as string,
      day: row.day as string,
      time: row.time as string,
      focus: row.focus as string,
      status: row.status as StreamStatus,
      sortOrder: (row.sort_order as number) ?? 0,
      streamUrls: parseStreamUrls(raw.stream_urls, raw.stream_url),
      startsAt: raw.starts_at ?? undefined,
      endsAt: raw.ends_at ?? undefined,
    };
    return {
      ...base,
      status: resolveStreamStatus(base),
    };
  });
}

export async function upsertAdminStream(input: AdminStreamInput) {
  const id =
    input.id?.trim() ||
    `stream-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const streamUrls = normalizeStreamUrls(input.streamUrls ?? []);

  const payload: Record<string, string | number | null | string[]> = {
    id,
    title: input.title.trim(),
    day: input.day.trim(),
    time: input.time.trim(),
    focus: input.focus.trim(),
    status: input.status,
    sort_order: input.sortOrder ?? 0,
    stream_urls: streamUrls,
  };

  if (input.startsAt !== undefined) {
    payload.starts_at = input.startsAt;
  }
  if (input.endsAt !== undefined) {
    payload.ends_at = input.endsAt;
  }

  const { error } = await getSupabase().from("streams").upsert(payload);
  if (error) {
    // Retry without schedule columns if migration not applied yet.
    if (
      error.message.includes("stream_urls") ||
      error.message.includes("stream_url") ||
      error.message.includes("starts_at") ||
      error.message.includes("ends_at")
    ) {
      const legacyPayload: Record<string, string | number | null> = {
        id,
        title: input.title.trim(),
        day: input.day.trim(),
        time: input.time.trim(),
        focus: input.focus.trim(),
        status: input.status === "ended" ? "upcoming" : input.status,
        sort_order: input.sortOrder ?? 0,
      };
      if (streamUrls[0]) legacyPayload.stream_url = streamUrls[0];
      if (input.startsAt !== undefined) legacyPayload.starts_at = input.startsAt;
      if (input.endsAt !== undefined) legacyPayload.ends_at = input.endsAt;

      const { error: legacyError } = await getSupabase()
        .from("streams")
        .upsert(legacyPayload);
      if (legacyError) {
        const { error: bareError } = await getSupabase().from("streams").upsert({
          id,
          title: input.title.trim(),
          day: input.day.trim(),
          time: input.time.trim(),
          focus: input.focus.trim(),
          status: input.status === "ended" ? "upcoming" : input.status,
          sort_order: input.sortOrder ?? 0,
        });
        if (bareError) throw bareError;
      }
      return id;
    }
    throw error;
  }
  return id;
}

export async function deleteAdminStream(id: string) {
  const { error } = await getSupabase().from("streams").delete().eq("id", id);
  if (error) throw error;
}

export async function loadAdminOrders(): Promise<AdminOrder[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, full_name, phone, address, zone_id, notes, payment_reference, proof_path, subtotal, gst, gst_rate, shipping_fee, grand_total, status, created_at, shipping_zones(label), order_items(product_id, product_name, unit_price, quantity)",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const items = (
      (row.order_items as
        | {
            product_id: string;
            product_name: string;
            unit_price: number;
            quantity: number;
          }[]
        | null) ?? []
    ).map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
    }));

    const zoneRelation = row.shipping_zones as
      | { label: string }
      | { label: string }[]
      | null;
    const zoneLabel = Array.isArray(zoneRelation)
      ? (zoneRelation[0]?.label ?? (row.zone_id as string))
      : (zoneRelation?.label ?? (row.zone_id as string));

    return {
      id: row.id as string,
      fullName: row.full_name as string,
      phone: row.phone as string,
      address: row.address as string,
      zoneId: row.zone_id as string,
      zoneLabel,
      notes: (row.notes as string) ?? "",
      paymentReference: row.payment_reference as string,
      proofPath: row.proof_path as string,
      subtotal: row.subtotal as number,
      gst: row.gst as number,
      gstRate: Number(row.gst_rate ?? 0.05),
      shippingFee: row.shipping_fee as number,
      grandTotal: row.grand_total as number,
      status: row.status as OrderStatus,
      createdAt: row.created_at as string,
      items,
    };
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { error } = await getSupabase()
    .from("orders")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function getProofSignedUrl(path: string) {
  const { data, error } = await getSupabase()
    .storage.from("payment-proofs")
    .createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function loadAdminHomeHighlight(): Promise<HomeHighlight> {
  const { data, error } = await getSupabase()
    .from("shop_settings")
    .select("home_highlight")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw error;
  return parseHomeHighlight(data?.home_highlight);
}

export async function saveAdminHomeHighlight(highlight: HomeHighlight) {
  const payload = parseHomeHighlight(highlight);
  const { error } = await getSupabase()
    .from("shop_settings")
    .update({ home_highlight: payload })
    .eq("id", "default");
  if (error) throw error;
  return payload;
}

export function formatOrderMoney(amount: number) {
  return formatNu(amount);
}
