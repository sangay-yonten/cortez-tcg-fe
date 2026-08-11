import { useEffect, useState } from "react";
import logo from "./assets/logo.jpg";
import AdminPage from "./components/AdminPage";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import HomePage from "./components/HomePage";
import { CartIcon, MenuIcon } from "./components/Icons";
import SchedulePage from "./components/SchedulePage";
import ShopPage, { type ShopFilter } from "./components/ShopPage";
import { CATEGORY_DEFS, type ProductCategory } from "./data/products";
import { useShop } from "./lib/ShopContext";
import "./App.css";

type ShopView = "home" | "shop" | "schedule" | "cart" | "checkout";
type View = ShopView | "admin";
type CartMap = Record<string, number>;

function readAdminHash() {
  return window.location.hash.replace(/^#/, "") === "admin";
}

export default function App() {
  const { products, error, source, ready, refresh } = useShop();
  const [view, setView] = useState<View>(() =>
    readAdminHash() ? "admin" : "home",
  );
  const [cart, setCart] = useState<CartMap>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopNavExpanded, setShopNavExpanded] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [catalogPage, setCatalogPage] = useState(1);
  const [shopFilter, setShopFilter] = useState<ShopFilter>("all");

  useEffect(() => {
    function onHashChange() {
      if (readAdminHash()) {
        setView("admin");
        closeMenu();
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartLines = products
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({
      product,
      quantity: cart[product.id],
    }));

  function scrollTo(id: string) {
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function closeMenu() {
    setMenuOpen(false);
    setShopNavExpanded(false);
  }

  function toggleMenu() {
    setMenuOpen((open) => {
      if (open) {
        setShopNavExpanded(false);
        return false;
      }
      setShopNavExpanded(view === "shop");
      return true;
    });
  }

  function setShopView(next: ShopView) {
    if (window.location.hash) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
    setView(next);
  }

  function goHome(anchor?: string) {
    setShopView("home");
    closeMenu();
    if (!anchor) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrollTo(anchor);
  }

  function openShop(filter: ShopFilter = "all", page = 1) {
    setShopFilter(filter);
    setCatalogPage(page);
    setShopView("shop");
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSchedule() {
    setShopView("schedule");
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCatalog(category: ProductCategory, page = 1) {
    openShop(category, page);
  }

  function changeShopFilter(filter: ShopFilter) {
    setShopFilter(filter);
    setCatalogPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAdmin() {
    window.location.hash = "admin";
    setView("admin");
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCart() {
    setShopView("cart");
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCheckout() {
    setShopView("checkout");
    closeMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeOrder() {
    setCart({});
    void refresh();
    goHome();
  }

  function addToCart(id: string) {
    const product = products.find((item) => item.id === id);
    if (product?.stock != null && product.stock <= 0) return;

    setCart((prev) => {
      const nextQty = (prev[id] ?? 0) + 1;
      if (product?.stock != null && nextQty > product.stock) {
        return prev;
      }
      return { ...prev, [id]: nextQty };
    });
    setAddedId(id);
    window.setTimeout(
      () => setAddedId((current) => (current === id ? null : current)),
      900,
    );
  }

  function increment(id: string) {
    const product = products.find((item) => item.id === id);
    setCart((prev) => {
      const nextQty = (prev[id] ?? 0) + 1;
      if (product?.stock != null && nextQty > product.stock) {
        return prev;
      }
      return { ...prev, [id]: nextQty };
    });
  }

  function decrement(id: string) {
    setCart((prev) => {
      const nextQty = (prev[id] ?? 0) - 1;
      if (nextQty <= 0) {
        return Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== id),
        );
      }
      return { ...prev, [id]: nextQty };
    });
  }

  function remove(id: string) {
    setCart((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([key]) => key !== id)),
    );
  }

  function changeCatalogPage(nextPage: number) {
    setCatalogPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const onShop = view === "shop";
  const onSchedule = view === "schedule";

  return (
    <div className="store">
      {view !== "admin" && (
        <div className="sticky-chrome">
          <header className="site-header">
            <a
              className="brand"
              href="#top"
              aria-label="Cortez TCG Live home"
              onClick={(event) => {
                event.preventDefault();
                goHome("top");
              }}
            >
              <img
                src={logo}
                alt=""
                className="brand-mark"
                width={40}
                height={40}
              />
              <span className="brand-text">
                <span className="brand-name">Cortez TCG Live</span>
                <span className="brand-tag">Collector&apos;s TCG Store</span>
              </span>
            </a>

            <div className="header-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                onClick={toggleMenu}
              >
                <MenuIcon />
              </button>
              <button
                type="button"
                className="icon-btn cart-btn"
                aria-label={`Cart, ${cartCount} items`}
                aria-current={
                  view === "cart" || view === "checkout" ? "page" : undefined
                }
                onClick={openCart}
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </button>
            </div>
          </header>

          {menuOpen && (
            <nav className="mobile-nav" aria-label="Primary">
              <button type="button" onClick={() => goHome("bio")}>
                Mission
              </button>
              <button
                type="button"
                aria-current={onSchedule ? "page" : undefined}
                onClick={openSchedule}
              >
                Schedule
              </button>
              <button
                type="button"
                className="mobile-nav-parent"
                aria-current={onShop ? "page" : undefined}
                aria-expanded={shopNavExpanded}
                aria-controls="shop-nav-sub"
                onClick={() => setShopNavExpanded((open) => !open)}
              >
                <span>Shop</span>
                <span className="mobile-nav-caret" aria-hidden="true">
                  {shopNavExpanded ? "▾" : "▸"}
                </span>
              </button>
              {shopNavExpanded && (
                <div
                  id="shop-nav-sub"
                  className="mobile-nav-sub"
                  role="group"
                  aria-label="Shop categories"
                >
                  <button
                    type="button"
                    className="is-sub"
                    aria-current={
                      onShop && shopFilter === "all" ? "page" : undefined
                    }
                    onClick={() => openShop("all")}
                  >
                    All products
                  </button>
                  {CATEGORY_DEFS.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="is-sub"
                      aria-current={
                        onShop && shopFilter === category.id
                          ? "page"
                          : undefined
                      }
                      onClick={() => openShop(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" onClick={openCart}>
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </button>
              <button type="button" onClick={openAdmin}>
                Admin login
              </button>
            </nav>
          )}
        </div>
      )}

      {view !== "admin" && error && (
        <p className="shop-banner is-error" role="status">
          Could not reach the live catalog ({error}). Showing local fallback.
        </p>
      )}
      {view !== "admin" && !error && ready && source === "local" && (
        <p className="shop-banner" role="status">
          Running on local catalog — add Supabase keys in `.env.local` for live
          inventory.
        </p>
      )}

      <main id="top">
        {view === "admin" ? (
          <AdminPage onBackHome={() => goHome()} />
        ) : view === "checkout" ? (
          <CheckoutPage
            items={cartLines}
            onBackToCart={openCart}
            onOrderComplete={completeOrder}
          />
        ) : view === "cart" ? (
          <CartPage
            items={cartLines}
            onIncrement={increment}
            onDecrement={decrement}
            onRemove={remove}
            onContinueShopping={() => openShop("all")}
            onCheckout={openCheckout}
          />
        ) : view === "shop" ? (
          <ShopPage
            filter={shopFilter}
            page={catalogPage}
            addedId={addedId}
            onFilterChange={changeShopFilter}
            onAddToCart={addToCart}
            onPageChange={changeCatalogPage}
            onBackHome={() => goHome()}
          />
        ) : view === "schedule" ? (
          <SchedulePage onBackHome={() => goHome()} />
        ) : (
          <HomePage
            addedId={addedId}
            onAddToCart={addToCart}
            onOpenCatalog={openCatalog}
            onOpenShop={() => openShop("all")}
            onOpenSchedule={openSchedule}
          />
        )}
      </main>

      {view !== "admin" && (
        <footer className="site-footer">
          <p>Cortez TCG Live · Live rips/openings, shipped with care</p>
        </footer>
      )}
    </div>
  );
}
