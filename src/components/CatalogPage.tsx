import {
  CATEGORY_LABELS,
  PAGE_SIZE,
  type ProductCategory,
} from "../data/products";
import { formatNu } from "../lib/money";
import { useShop } from "../lib/ShopContext";
import { CartIcon } from "./Icons";

type CatalogPageProps = {
  category: ProductCategory;
  page: number;
  addedId: string | null;
  onAddToCart: (id: string) => void;
  onPageChange: (page: number) => void;
  onBackHome: () => void;
};

export default function CatalogPage({
  category,
  page,
  addedId,
  onAddToCart,
  onPageChange,
  onBackHome,
}: CatalogPageProps) {
  const { products, loading } = useShop();
  const catalog = products.filter((product) => product.category === category);
  const totalPages = Math.max(1, Math.ceil(catalog.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = catalog.slice(start, start + PAGE_SIZE);
  const title = CATEGORY_LABELS[category];

  return (
    <section className="packs-page" aria-labelledby="catalog-page-heading">
      <div className="packs-page-header">
        <button type="button" className="back-link" onClick={onBackHome}>
          ← Home
        </button>
        <h1 id="catalog-page-heading" className="packs-page-title">
          {title}
        </h1>
        <p className="packs-page-meta">
          {loading
            ? "Loading catalog…"
            : catalog.length === 0
              ? "No items in this category yet"
              : `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, catalog.length)} of ${catalog.length} · GST added at checkout`}
        </p>
      </div>

      {catalog.length === 0 ? (
        <div className="cart-empty">
          <p>Nothing listed here yet. Check back after the next restock.</p>
        </div>
      ) : (
        <ul className="product-grid">
          {visible.map((product) => {
            const outOfStock = product.stock != null && product.stock <= 0;
            const metaBits = [
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
