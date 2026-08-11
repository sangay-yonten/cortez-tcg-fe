import type { Product } from "../data/products";
import { calcCartTotal, calcGst, formatNu, GST_RATE } from "../lib/money";

export type CartLine = {
  product: Product;
  quantity: number;
};

type CartPageProps = {
  items: CartLine[];
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onContinueShopping: () => void;
  onCheckout: () => void;
};

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path
        fill="currentColor"
        d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM7 9h2v9H7V9Zm-1 12h12a1 1 0 0 0 1-1V8H5v12a1 1 0 0 0 1 1Z"
      />
    </svg>
  );
}

export default function CartPage({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onContinueShopping,
  onCheckout,
}: CartPageProps) {
  const subtotal = items.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const gst = calcGst(subtotal);
  const total = calcCartTotal(subtotal);
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
  const gstPercent = Math.round(GST_RATE * 100);

  return (
    <section className="cart-page" aria-labelledby="cart-heading">
      <div className="cart-page-header">
        <h1 id="cart-heading" className="cart-page-title">
          Your Cart
        </h1>
        <p className="cart-page-meta">
          {itemCount === 0
            ? "No packs yet"
            : `${itemCount} pack${itemCount === 1 ? "" : "s"} · shipping & payable at checkout`}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>
            Your cart is empty. Grab some loose packs and hop into a stream.
          </p>
          <button
            type="button"
            className="cart-primary-btn"
            onClick={onContinueShopping}
          >
            Browse Loose Packs
          </button>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="cart-line">
                <img
                  src={product.image}
                  alt=""
                  className="cart-line-image"
                  width={72}
                  height={104}
                />
                <div className="cart-line-body">
                  <h2 className="cart-line-name">{product.name}</h2>
                  <p className="cart-line-price">{formatNu(product.price)}</p>
                  <div className="cart-line-actions">
                    <div className="qty-control" aria-label="Quantity">
                      <button
                        type="button"
                        className="qty-btn"
                        aria-label={`Decrease quantity of ${product.name}`}
                        onClick={() => onDecrement(product.id)}
                      >
                        −
                      </button>
                      <span className="qty-value">{quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        aria-label={`Increase quantity of ${product.name}`}
                        onClick={() => onIncrement(product.id)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-remove-btn"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => onRemove(product.id)}
                    >
                      <TrashIcon />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatNu(subtotal)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>GST ({gstPercent}%)</span>
              <strong>{formatNu(gst)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <cite className="cart-summary-pending">
                Calculated at checkout
              </cite>
            </div>
            <div className="cart-summary-row is-total">
              <span>Items total</span>
              <strong>{formatNu(total)}</strong>
            </div>
            <p className="cart-summary-note">
              Final <strong>Payable Amount</strong> is computed on the next step
              after you choose delivery{" "}
              <cite>(Thimphu · Paro · Rest of Bhutan)</cite> and shipping is
              added.
            </p>
            <button
              type="button"
              className="cart-primary-btn"
              onClick={onCheckout}
            >
              Checkout
            </button>
            <button
              type="button"
              className="cart-secondary-btn"
              onClick={onContinueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </>
      )}
    </section>
  );
}
