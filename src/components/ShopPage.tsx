import {
  allShopCategories,
  getCategoryDef,
  PAGE_SIZE,
  type ProductCategory,
} from "../data/products";
import { formatNu } from "../lib/money";
import { useShop } from "../lib/ShopContext";
import { CartIcon } from "./Icons";
import { ProductGridSkeleton } from "./Skeleton";

export type ShopFilter = ProductCategory | "all";

type ShopPageProps = {
  filter: ShopFilter;
  page: number;
  addedId: string | null;
  onFilterChange: (filter: ShopFilter) => void;
  onAddToCart: (id: string) => void;
  onPageChange: (page: number) => void;
  onBackHome: () => void;
};

export default function ShopPage({
  filter,
  page,
  addedId,
  onFilterChange,
  onAddToCart,
  onPageChange,
  onBackHome,
}: ShopPageProps) {
  const { products, loading, ready } = useShop();
  const showSkeletons = !ready;
  const categories = allShopCategories();
  const catalog =
    filter === "all"
      ? products
      : products.filter((product) => product.category === filter);

  const totalPages = Math.max(1, Math.ceil(catalog.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = catalog.slice(start, start + PAGE_SIZE);
  const heading =
    filter === "all" ? "Shop catalog" : getCategoryDef(filter).label;

  return (
    <section className="packs-page shop-page" aria-labelledby="shop-heading">
      <div className="packs-page-header">
        <button type="button" className="back-link" onClick={onBackHome}>
          ← Home
        </button>
        <h1 id="shop-heading" className="packs-page-title">
          {heading}
        </h1>
        <p className="packs-page-meta">
          {showSkeletons
            ? "Loading catalog…"
            : loading
              ? "Refreshing catalog…"
              : catalog.length === 0
                ? "No items in this category yet"
                : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, catalog.length)} of ${catalog.length} · GST added at checkout`}
        </p>
      </div>

      <div className="shop-filter-row" role="tablist" aria-label="Catalog filter">
        <button
          type="button"
          role="tab"
          className={`shop-filter-chip${filter === "all" ? " is-active" : ""}`}
          aria-selected={filter === "all"}
          onClick={() => onFilterChange("all")}
        >
          All
        </button>
        {categories.map((category) => {
          const def = getCategoryDef(category);
          return (
            <button
              key={category}
              type="button"
              role="tab"
              className={`shop-filter-chip${filter === category ? " is-active" : ""}`}
              aria-selected={filter === category}
              onClick={() => onFilterChange(category)}
            >
              {def.label}
            </button>
          );
        })}
      </div>

      {showSkeletons ? (
        <ProductGridSkeleton />
      ) : catalog.length === 0 ? (
        <div className="cart-empty">
          <p>Nothing listed here yet. Check back after the next restock.</p>
        </div>
      ) : (
        <ul className="product-grid">
          {visible.map((product) => {
            const outOfStock = product.stock != null && product.stock <= 0;
            const metaBits = [
              getCategoryDef(product.category).label,
              product.packDetails?.setCode,
              product.cardDetails?.setCode,
              product.cardDetails?.cardNumber,
              product.cardDetails?.rarity,
              product.cardDetails?.condition,
              product.boxDetails?.packsPerBox
                ? `${product.boxDetails.packsPerBox} packs`
                : null,
              product.boxDetails?.sealed ? "Sealed" : null,
            ].filter(Boolean);

            return (
              <li key={product.id} className="product-card">
                <div className="product-media">
                  <img src={product.image} alt="" className="product-image" />
                </div>
                <h2 className="product-name">{product.name}</h2>
                {metaBits.length > 0 && (
                  <p className="product-meta">{metaBits.join(" · ")}</p>
                )}
                <p className="product-price">
                  {product.compareAt != null && (
                    <span className="deal-compare">
                      {formatNu(product.compareAt)}
                    </span>
                  )}
                  <span className="product-price-now">
                    {formatNu(product.price)}
                  </span>
                </p>
                <button
                  type="button"
                  className={`add-btn${addedId === product.id ? " is-added" : ""}`}
                  disabled={outOfStock}
                  onClick={() => onAddToCart(product.id)}
                >
                  <span>
                    {outOfStock
                      ? "Sold out"
                      : addedId === product.id
                        ? "Added"
                        : "Add to Cart"}
                  </span>
                  <CartIcon />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {catalog.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            className="pagination-btn"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Previous
          </button>
          <p className="pagination-status">
            Page {safePage} of {totalPages}
          </p>
          <button
            type="button"
            className="pagination-btn"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
