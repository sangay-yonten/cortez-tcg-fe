import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CATEGORY_DEFS,
  CATEGORY_LABELS,
  type ProductBadge,
  type ProductBoxDetails,
  type ProductCardDetails,
  type ProductCategory,
} from "../data/products";
import {
  setAdminProductImage,
  type AdminProduct,
  type AdminProductCreate,
  type AdminProductPatch,
} from "../lib/adminApi";
import {
  isUploadedProductImage,
  PLACEHOLDER_PRODUCT_IMAGE_KEY,
  resolveProductImage,
} from "../lib/productImages";
import AdminSelect from "./AdminSelect";

const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "No badge" },
  { value: "hot", label: "Hot deal" },
  { value: "favorite", label: "Crew favorite" },
  { value: "new", label: "New" },
];

type AdminProductDetailProps = {
  mode: "create" | "edit";
  product?: AdminProduct;
  saving: boolean;
  onBack: () => void;
  onSaveEdit?: (patch: AdminProductPatch) => Promise<void>;
  onCreate?: (input: AdminProductCreate) => Promise<void>;
};

function initialPricing(product?: AdminProduct) {
  if (!product) {
    return { basePrice: "", onDiscount: false, salePrice: "" };
  }
  const hasDiscount =
    product.compareAt != null && product.compareAt > product.price;
  return {
    basePrice: String(hasDiscount ? product.compareAt : product.price),
    onDiscount: hasDiscount,
    salePrice: hasDiscount ? String(product.price) : "",
  };
}

export default function AdminProductDetail({
  mode,
  product,
  saving,
  onBack,
  onSaveEdit,
  onCreate,
}: AdminProductDetailProps) {
  const isCreate = mode === "create";
  const startingPrice = initialPricing(product);
  const [category, setCategory] = useState<ProductCategory>(
    product?.category ?? "loose_pack",
  );
  const [name, setName] = useState(product?.name ?? "");
  const [skuId, setSkuId] = useState(product?.id ?? "");
  const [badge, setBadge] = useState<string>(product?.badge ?? "");
  const [basePrice, setBasePrice] = useState(startingPrice.basePrice);
  const [onDiscount, setOnDiscount] = useState(startingPrice.onDiscount);
  const [salePrice, setSalePrice] = useState(startingPrice.salePrice);
  const [stock, setStock] = useState(
    product?.stock != null ? String(product.stock) : "0",
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [imageUrl, setImageUrl] = useState(
    product?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE_KEY,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const [setCode, setSetCode] = useState(
    product?.cardDetails?.setCode ?? "",
  );
  const [cardNumber, setCardNumber] = useState(
    product?.cardDetails?.cardNumber ?? "",
  );
  const [rarity, setRarity] = useState(product?.cardDetails?.rarity ?? "");
  const [condition, setCondition] = useState(
    product?.cardDetails?.condition ?? "NM",
  );
  const [language, setLanguage] = useState(
    product?.cardDetails?.language ?? "EN",
  );
  const [packsPerBox, setPacksPerBox] = useState(
    product?.boxDetails?.packsPerBox != null
      ? String(product.boxDetails.packsPerBox)
      : "",
  );
  const [sealed, setSealed] = useState(product?.boxDetails?.sealed ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setLocalPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const previewImage = useMemo(() => {
    if (localPreview) return localPreview;
    if (clearImage) return resolveProductImage(PLACEHOLDER_PRODUCT_IMAGE_KEY);
    return resolveProductImage(imageUrl);
  }, [clearImage, imageUrl, localPreview]);

  const hasCustomImage =
    Boolean(pendingFile) ||
    (!clearImage && isUploadedProductImage(imageUrl));

  function onPickImage(file: File | null) {
    setError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }
    setPendingFile(file);
    setClearImage(false);
  }

  function onRemoveImage() {
    setPendingFile(null);
    setClearImage(true);
    if (isCreate) {
      setImageUrl(PLACEHOLDER_PRODUCT_IMAGE_KEY);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const nextBase = Number(basePrice);
    const nextStock = Number(stock);
    const nextSale = salePrice.trim() === "" ? NaN : Number(salePrice);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!Number.isFinite(nextBase) || nextBase < 0) {
      setError("Base price must be a valid number.");
      return;
    }
    if (!Number.isFinite(nextStock) || nextStock < 0) {
      setError("Stock must be a valid number.");
      return;
    }

    let nextPrice = nextBase;
    let nextCompare: number | null = null;

    if (onDiscount) {
      if (!Number.isFinite(nextSale) || nextSale < 0) {
        setError("Enter the discounted sell price.");
        return;
      }
      if (nextSale >= nextBase) {
        setError("Discounted price must be lower than the base price.");
        return;
      }
      nextPrice = nextSale;
      nextCompare = nextBase;
    }

    let cardDetails: ProductCardDetails | undefined;
    let boxDetails: ProductBoxDetails | undefined;

    if (category === "raw_card") {
      cardDetails = {
        setCode: setCode.trim() || undefined,
        cardNumber: cardNumber.trim() || undefined,
        rarity: rarity.trim() || undefined,
        condition: condition.trim() || undefined,
        language: language.trim() || undefined,
      };
    }

    if (category === "booster_box") {
      const packs = packsPerBox.trim() === "" ? undefined : Number(packsPerBox);
      if (packs != null && (!Number.isFinite(packs) || packs <= 0)) {
        setError("Packs per box must be a positive number.");
        return;
      }
      boxDetails = { packsPerBox: packs, sealed };
    }

    try {
      const trimmedName = name.trim();
      if (isCreate) {
        if (!onCreate) return;
        await onCreate({
          id: skuId.trim() || undefined,
          name: trimmedName,
          category,
          price: nextPrice,
          compareAt: nextCompare,
          stock: nextStock,
          isActive,
          imageFile: pendingFile,
          imageUrl: clearImage
            ? PLACEHOLDER_PRODUCT_IMAGE_KEY
            : imageUrl || PLACEHOLDER_PRODUCT_IMAGE_KEY,
          badge: (badge || null) as ProductBadge | null,
          cardDetails,
          boxDetails,
          packDetails: category === "loose_pack" ? null : undefined,
        });
        return;
      }

      if (!onSaveEdit || !product) return;

      let nextImageUrl = imageUrl;
      if (pendingFile || clearImage) {
        nextImageUrl = await setAdminProductImage(product.id, {
          file: pendingFile,
          clear: clearImage && !pendingFile,
          previousUrl: product.imageUrl,
        });
      }

      await onSaveEdit({
        name: trimmedName,
        price: nextPrice,
        stock: nextStock,
        compareAt: nextCompare,
        isActive,
        badge: (badge || null) as ProductBadge | null,
        imageUrl: nextImageUrl,
        cardDetails,
        boxDetails,
        packDetails: category === "loose_pack" ? null : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
    }
  }

  return (
    <section
      className="admin-product-detail"
      aria-labelledby="product-detail-heading"
    >
      <button type="button" className="back-link" onClick={onBack}>
        ← Catalog
      </button>
      <div className="admin-product-detail-head">
        <img src={previewImage} alt="" width={56} height={78} />
        <div>
          <p className="admin-kicker">
            {isCreate ? "New catalog item" : CATEGORY_LABELS[category]}
          </p>
          <h2 id="product-detail-heading" className="admin-title">
            {isCreate ? "Add product" : name || product?.name}
          </h2>
          {!isCreate && <p className="admin-muted">{product?.id}</p>}
        </div>
      </div>

      <form
        className="admin-product-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        {isCreate && (
          <div className="admin-form-grid">
            <div className="field">
              <span className="field-label">Category</span>
              <AdminSelect
                value={category}
                options={CATEGORY_DEFS.map((item) => ({
                  value: item.id,
                  label: item.label,
                }))}
                onChange={(next) => setCategory(next as ProductCategory)}
              />
            </div>
            <label className="field admin-field-span">
              <span className="field-label">SKU id (optional)</span>
              <input
                value={skuId}
                onChange={(event) => setSkuId(event.target.value)}
                placeholder="auto from name"
              />
            </label>
          </div>
        )}

        <fieldset className="admin-fieldset">
          <legend>Product image</legend>
          <p className="admin-muted admin-fieldset-hint">
            Upload a JPEG, PNG, WebP, or GIF (max 5 MB). If you skip this, a
            simple placeholder is shown until you add art.
          </p>
          <div className="admin-image-editor">
            <img
              src={previewImage}
              alt=""
              className="admin-image-preview"
              width={120}
              height={168}
            />
            <div className="admin-image-actions">
              <label className="cart-secondary-btn admin-image-upload">
                {hasCustomImage ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    onPickImage(file);
                    event.target.value = "";
                  }}
                />
              </label>
              {hasCustomImage && (
                <button
                  type="button"
                  className="admin-text-btn is-danger"
                  onClick={onRemoveImage}
                >
                  Remove image
                </button>
              )}
              {pendingFile && (
                <p className="admin-muted">{pendingFile.name}</p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="admin-form-grid">
          <label className="field admin-field-span">
            <span className="field-label">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="OP-06 Wings"
            />
          </label>
          <div className="field">
            <span className="field-label">Badge</span>
            <AdminSelect
              value={badge}
              options={BADGE_OPTIONS}
              onChange={setBadge}
            />
          </div>
          <label className="field">
            <span className="field-label">Stock</span>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
          </label>
          <label className="admin-toggle-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />
            <span>Listed in shop</span>
          </label>
        </div>

        <fieldset className="admin-fieldset">
          <legend>Pricing</legend>
          <p className="admin-muted admin-fieldset-hint">
            Base price is the normal amount. Turn on discount only when you want
            a lower sell price — shoppers see ~~base~~ and pay the sale price.
          </p>
          <div className="admin-form-grid">
            <label className="field">
              <span className="field-label">Base price (Nu.)</span>
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(event) => setBasePrice(event.target.value)}
                required
                placeholder="e.g. 120"
              />
            </label>
            <label className="admin-toggle-row">
              <input
                type="checkbox"
                checked={onDiscount}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setOnDiscount(checked);
                  if (!checked) setSalePrice("");
                }}
              />
              <span>On discount</span>
            </label>
            {onDiscount && (
              <label className="field">
                <span className="field-label">Sale price (Nu.)</span>
                <input
                  type="number"
                  min={0}
                  value={salePrice}
                  onChange={(event) => setSalePrice(event.target.value)}
                  required
                  placeholder="Lower than base"
                />
              </label>
            )}
          </div>
        </fieldset>

        {category === "raw_card" && (
          <fieldset className="admin-fieldset">
            <legend>Card metadata</legend>
            <div className="admin-form-grid">
              <label className="field">
                <span className="field-label">Set code</span>
                <input
                  value={setCode}
                  onChange={(event) => setSetCode(event.target.value)}
                  placeholder="OP-05"
                />
              </label>
              <label className="field">
                <span className="field-label">Card number</span>
                <input
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                  placeholder="OP05-001"
                />
              </label>
              <label className="field">
                <span className="field-label">Rarity</span>
                <input
                  value={rarity}
                  onChange={(event) => setRarity(event.target.value)}
                  placeholder="SR / SEC / R"
                />
              </label>
              <label className="field">
                <span className="field-label">Condition</span>
                <input
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  placeholder="NM"
                />
              </label>
              <label className="field">
                <span className="field-label">Language</span>
                <input
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  placeholder="EN"
                />
              </label>
            </div>
          </fieldset>
        )}

        {category === "booster_box" && (
          <fieldset className="admin-fieldset">
            <legend>Box metadata</legend>
            <div className="admin-form-grid">
              <label className="field">
                <span className="field-label">Packs per box</span>
                <input
                  type="number"
                  min={1}
                  value={packsPerBox}
                  onChange={(event) => setPacksPerBox(event.target.value)}
                  placeholder="24 / 10 / 6…"
                />
              </label>
              <label className="admin-toggle-row">
                <input
                  type="checkbox"
                  checked={sealed}
                  onChange={(event) => setSealed(event.target.checked)}
                />
                <span>Sealed</span>
              </label>
            </div>
          </fieldset>
        )}

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-detail-actions">
          <button type="button" className="cart-secondary-btn" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="cart-primary-btn" disabled={saving}>
            {saving
              ? "Saving…"
              : isCreate
                ? "Create product"
                : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
