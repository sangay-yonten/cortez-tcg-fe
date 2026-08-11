import placeholderImage from "../assets/product-placeholder.svg";

/** Stored in `products.image_url` when no upload is set. */
export const PLACEHOLDER_PRODUCT_IMAGE_KEY = "placeholder";

const PRODUCT_IMAGES_BUCKET = "product-images";

/** Maps DB `image_url` values to a displayable src. */
export function resolveProductImage(imageUrl: string | null | undefined): string {
  if (!imageUrl || !imageUrl.trim() || imageUrl === PLACEHOLDER_PRODUCT_IMAGE_KEY) {
    return placeholderImage;
  }
  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://") ||
    imageUrl.startsWith("/") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:")
  ) {
    return imageUrl;
  }
  // Legacy seed keys (op05…) no longer ship assets — use placeholder.
  return placeholderImage;
}

/** Extract storage object path from a public product-images URL. */
export function productImagePathFromUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  const path = decodeURIComponent(
    imageUrl.slice(idx + marker.length).split("?")[0] ?? "",
  );
  return path || null;
}

export function isUploadedProductImage(imageUrl: string | null | undefined) {
  return productImagePathFromUrl(imageUrl) != null;
}

export function isPlaceholderProductImage(imageUrl: string | null | undefined) {
  return (
    !imageUrl ||
    !imageUrl.trim() ||
    imageUrl === PLACEHOLDER_PRODUCT_IMAGE_KEY ||
    !isUploadedProductImage(imageUrl)
  );
}

export { PRODUCT_IMAGES_BUCKET, placeholderImage };
