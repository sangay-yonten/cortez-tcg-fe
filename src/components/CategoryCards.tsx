import {
  CATEGORY_DEFS,
  type ProductCategory,
} from "../data/products";

type CategoryCardsProps = {
  categories?: ProductCategory[];
  activeCategory?: ProductCategory | "all";
  compact?: boolean;
  onSelect: (category: ProductCategory) => void;
};

export default function CategoryCards({
  categories,
  activeCategory,
  compact = false,
  onSelect,
}: CategoryCardsProps) {
  const ids =
    categories ?? CATEGORY_DEFS.map((category) => category.id);
  const defs = CATEGORY_DEFS.filter((category) => ids.includes(category.id));

  return (
    <section
      className={`shop-dirs${compact ? " is-compact" : ""}`}
      aria-label="Shop categories"
      style={{ ["--shop-dir-count" as string]: String(defs.length) }}
    >
      {defs.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            type="button"
            key={category.id}
            className={`shop-dir${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => onSelect(category.id)}
          >
            <span className="shop-dir-kicker">Browse</span>
            <span className="shop-dir-title">{category.label}</span>
            <span className="shop-dir-copy">{category.blurb}</span>
          </button>
        );
      })}
    </section>
  );
}
