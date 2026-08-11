import { useEffect, useState } from "react";
import {
  formatOrderMoney,
  getProofSignedUrl,
  type AdminOrder,
  type OrderStatus,
} from "../lib/adminApi";
import AdminSelect from "./AdminSelect";

type AdminOrderDetailProps = {
  order: AdminOrder;
  saving: boolean;
  onBack: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onOpenInvoice: () => void;
};

const STATUS_OPTIONS: OrderStatus[] = [
  "pending_payment",
  "paid",
  "packed",
  "shipped",
  "cancelled",
];

function statusLabel(status: OrderStatus) {
  return status.replaceAll("_", " ");
}

export default function AdminOrderDetail({
  order,
  saving,
  onBack,
  onStatusChange,
  onOpenInvoice,
}: AdminOrderDetailProps) {
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(true);
  const [proofError, setProofError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setProofLoading(true);
    setProofError(null);
    setProofUrl(null);

    void (async () => {
      try {
        const url = await getProofSignedUrl(order.proofPath);
        if (!alive) return;
        setProofUrl(url);
      } catch (err) {
        if (!alive) return;
        setProofError(
          err instanceof Error ? err.message : "Could not load payment proof",
        );
      } finally {
        if (alive) setProofLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [order.proofPath, order.id]);

  const gstPercent = Math.round(order.gstRate * 100);

  return (
    <article className="order-detail-page" aria-labelledby="order-detail-title">
      <header className="order-detail-header">
        <div className="order-detail-header-main">
          <button
            type="button"
            className="back-link order-detail-back"
            onClick={onBack}
          >
            ← Orders
          </button>
          <div className="order-detail-title-row">
            <h2 id="order-detail-title">{order.id}</h2>
            <span className={`admin-status is-${order.status}`}>
              {statusLabel(order.status)}
            </span>
          </div>
          <p className="admin-muted">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </header>

      <div className="order-detail-actions-bar">
        <div className="field order-detail-status">
          <AdminSelect
            label="Order status"
            value={order.status}
            disabled={saving}
            options={STATUS_OPTIONS.map((status) => ({
              value: status,
              label: statusLabel(status),
            }))}
            onChange={(next) => onStatusChange(next as OrderStatus)}
          />
        </div>
        <button
          type="button"
          className="cart-primary-btn"
          onClick={onOpenInvoice}
        >
          Invoice
        </button>
      </div>

      <div className="order-detail-grid">
        <section className="order-detail-panel">
          <h3>Customer</h3>
          <p>
            <strong>{order.fullName}</strong>
          </p>
          <p>{order.phone}</p>
          <p>{order.address}</p>
          <p className="admin-muted">Delivery zone · {order.zoneLabel}</p>
          {order.notes ? (
            <p className="admin-muted">Notes · {order.notes}</p>
          ) : null}

          <h3>Payment</h3>
          <p>
            Bank transfer · Ref <code>{order.paymentReference}</code>
          </p>

          <h3>Line items</h3>
          <div className="order-detail-items-wrap">
            <table className="order-detail-items-table">
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
          </div>

          <h3>Totals</h3>
          <dl className="order-detail-fees">
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
            <div className="is-total">
              <dt>Payable</dt>
              <dd>{formatOrderMoney(order.grandTotal)}</dd>
            </div>
          </dl>
        </section>

        <section className="order-detail-proof">
          <h3>Payment proof</h3>
          {proofLoading && (
            <div className="proof-loader" role="status" aria-live="polite">
              <span className="proof-spinner" aria-hidden="true" />
              <p>Loading payment proof…</p>
            </div>
          )}
          {proofError && (
            <p className="field-error" role="alert">
              {proofError}
            </p>
          )}
          {proofUrl && !proofLoading && (
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              className="order-detail-proof-link"
            >
              <img
                src={proofUrl}
                alt={`Payment proof for ${order.id}`}
                className="order-detail-proof-image"
              />
            </a>
          )}
        </section>
      </div>
    </article>
  );
}
