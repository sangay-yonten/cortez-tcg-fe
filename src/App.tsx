import { useState } from "react";
import logo from "./assets/logo.jpg";
import { products } from "./data/products";
import CartPage from "./components/CartPage";
import CheckoutPage from "./components/CheckoutPage";
import HomePage from "./components/HomePage";
import LoosePacksPage from "./components/LoosePacksPage";
import { CartIcon, MenuIcon } from "./components/Icons";
import "./App.css";

type View = "home" | "packs" | "cart" | "checkout";
type CartMap = Record<string, number>;

export default function App() {
  const [view, setView] = useState<View>("home");
  const [cart, setCart] = useState<CartMap>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [packsPage, setPacksPage] = useState(1);

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

  function goHome(anchor?: string) {
    setView("home");
    setMenuOpen(false);
    if (!anchor) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrollTo(anchor);
  }

  function openPacks(page = 1) {
    setPacksPage(page);
    setView("packs");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCart() {
    setView("cart");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCheckout() {
    setView("checkout");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function completeOrder() {
    setCart({});
    goHome();
  }

  function addToCart(id: string) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setAddedId(id);
    window.setTimeout(
      () => setAddedId((current) => (current === id ? null : current)),
      900,
    );
  }

  function increment(id: string) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
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

  function changePacksPage(nextPage: number) {
    setPacksPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="store">
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
              <span className="brand-tag">Collector's TCG Store</span>
            </span>
          </a>

          <div className="header-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
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
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </header>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Primary">
            <button type="button" onClick={() => goHome("bio")}>
              Mission
            </button>
            <button type="button" onClick={() => goHome("streams")}>
              Streams
            </button>
            <button
              type="button"
              aria-current={view === "packs" ? "page" : undefined}
              onClick={() => openPacks()}
            >
              Loose Packs
            </button>
            <button type="button" onClick={openCart}>
              Cart{cartCount > 0 ? ` (${cartCount})` : ""}
            </button>
          </nav>
        )}
      </div>

      <main id="top">
        {view === "checkout" ? (
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
            onContinueShopping={() => openPacks()}
            onCheckout={openCheckout}
          />
        ) : view === "packs" ? (
          <LoosePacksPage
            page={packsPage}
            addedId={addedId}
            onAddToCart={addToCart}
            onPageChange={changePacksPage}
            onBackHome={() => goHome()}
          />
        ) : (
          <HomePage
            addedId={addedId}
            onAddToCart={addToCart}
            onSeeAllPacks={() => openPacks()}
            onBrowseStreams={() => scrollTo("streams")}
          />
        )}
      </main>

      <footer className="site-footer">
        <p>Cortez TCG Live · Live rips/openings, shipped with care</p>
      </footer>
    </div>
  );
}
