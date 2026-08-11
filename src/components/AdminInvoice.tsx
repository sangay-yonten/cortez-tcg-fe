import { formatOrderMoney, type AdminOrder } from "../lib/adminApi";

type AdminInvoiceProps = {
  order: AdminOrder;
  shopName?: string;
  onClose: () => void;
};

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default function AdminInvoice({
  order,
  shopName = "Cortez TCG Live",
  onClose,
}: AdminInvoiceProps) {
  const gstPercent = Math.round(order.gstRate * 100);
  const issued = new Date(order.createdAt);

  return (
    <div className="invoice-overlay" role="dialog" aria-modal="true">
      <div className="invoice-shell">
        <div className="invoice-toolbar no-print">
          <button
            type="button"
            className="cart-secondary-btn"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
          <button
            type="button"
            className="invoice-close-btn"
            onClick={onClose}
            aria-label="Close invoice"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18">
              <path
                fill="currentColor"
                d="M6.4 5.3 5.3 6.4 10.9 12l-5.6 5.6 1.1 1.1L12 13.1l5.6 5.6 1.1-1.1L13.1 12l5.6-5.6-1.1-1.1L12 10.9 6.4 5.3Z"
              />
            </svg>
          </button>
        </div>

        <article className="invoice-sheet" id="admin-invoice">
          <header className="invoice-header">
            <div>
              <p className="invoice-brand">{shopName}</p>
              <p className="invoice-tag">Order invoice · Bhutan delivery</p>
            </div>
            <div className="invoice-meta">
              <p>
                <strong>{order.id}</strong>
              </p>
              <p>{issued.toLocaleString()}</p>
              <p className="invoice-status">{statusLabel(order.status)}</p>
            </div>
          </header>

          <section className="invoice-parties">
            <div>
              <h2>Bill to</h2>
              <p>
                <strong>{order.fullName}</strong>
              </p>
              <p>{order.phone}</p>
              <p>{order.address}</p>
              <p>Zone: {order.zoneLabel}</p>
            </div>
            <div>
              <h2>Payment</h2>
              <p>Bank transfer</p>
              <p>
                Ref: <strong>{order.paymentReference}</strong>
              </p>
              {order.notes ? <p>Notes: {order.notes}</p> : null}
            </div>
          </section>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={`${order.id}-${item.productId}`}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{formatOrderMoney(item.unitPrice)}</td>
                  <td>{formatOrderMoney(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="invoice-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatOrderMoney(order.subtotal)}</dd>
            </div>
            <div>
              <dt>GST ({gstPercent}%)</dt>
              <dd>{formatOrderMoney(order.gst)}</dd>
            </div>
            <div>
              <dt>Shipping · {order.zoneLabel}</dt>
              <dd>
                {order.shippingFee === 0
                  ? "Free"
                  : formatOrderMoney(order.shippingFee)}
              </dd>
            </div>
            <div className="is-grand">
              <dt>Payable total</dt>
              <dd>{formatOrderMoney(order.grandTotal)}</dd>
            </div>
          </dl>

          <footer className="invoice-footer">
            <p>
              Thank you for supporting {shopName}. Keep this invoice with your
              transfer reference for delivery confirmation.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
