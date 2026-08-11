import { useEffect, useId, useState, type FormEvent } from "react";
import type { CartLine } from "./CartPage";
import {
  DEFAULT_SHIPPING_ZONE,
  type ShippingZoneId,
} from "../data/shipping";
import { calcCartTotal, calcGst, formatNu } from "../lib/money";
import { useShop } from "../lib/ShopContext";
import { submitOrder } from "../lib/shopApi";

type CheckoutStep = 1 | 2 | 3;

export type CheckoutDetails = {
  fullName: string;
  phone: string;
  address: string;
  zoneId: ShippingZoneId;
  notes: string;
};

type CheckoutPageProps = {
  items: CartLine[];
  onBackToCart: () => void;
  onOrderComplete: () => void;
};

type TouchedMap = Record<string, boolean>;

const emptyDetails: CheckoutDetails = {
  fullName: "",
  phone: "",
  address: "",
  zoneId: DEFAULT_SHIPPING_ZONE,
  notes: "",
};

function RequiredMark() {
  return (
    <span className="req" aria-hidden="true">
      *
    </span>
  );
}

function getDetailsErrors(details: CheckoutDetails) {
  const next: Record<string, string> = {};
  if (!details.fullName.trim()) next.fullName = "Name is required";
  if (!/^\+?\d[\d\s-]{6,}$/.test(details.phone.trim())) {
    next.phone = "Enter a valid Bhutan contact number";
  }
  if (details.address.trim().length < 8) {
    next.address = "Add a delivery address we can courier to";
  }
  if (!details.zoneId) next.zoneId = "Choose a delivery zone";
  return next;
}

function getPaymentErrors(reference: string, proofFile: File | null) {
  const next: Record<string, string> = {};
  if (!reference.trim()) next.reference = "Add your bank transfer reference";
  if (!proofFile) next.proof = "Attach a payment screenshot";
  return next;
}

export default function CheckoutPage({
  items,
  onBackToCart,
  onOrderComplete,
}: CheckoutPageProps) {
  const formId = useId();
  const { shippingZones, settings } = useShop();
  const [step, setStep] = useState<CheckoutStep>(1);
  const [details, setDetails] = useState<CheckoutDetails>(emptyDetails);
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [touched, setTouched] = useState<TouchedMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const gstRate = settings.gstRate;
  const zone =
    shippingZones.find((option) => option.id === details.zoneId) ??
    shippingZones[0];
  const subtotal = items.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const gst = calcGst(subtotal, gstRate);
  const goodsTotal = calcCartTotal(subtotal, gstRate);
  const shipping = zone?.fee ?? 0;
  const grandTotal = goodsTotal + shipping;
  const gstPercent = Math.round(gstRate * 100);

  const detailsErrors = getDetailsErrors(details);
  const paymentErrors = getPaymentErrors(reference, proofFile);
  const detailsValid = Object.keys(detailsErrors).length === 0;
  const paymentValid = Object.keys(paymentErrors).length === 0;

  useEffect(() => {
    if (
      shippingZones.length > 0 &&
      !shippingZones.some((option) => option.id === details.zoneId)
    ) {
      setDetails((prev) => ({ ...prev, zoneId: shippingZones[0].id }));
    }
  }, [shippingZones, details.zoneId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  function markTouched(key: string) {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  function fieldError(key: string, errors: Record<string, string>) {
    return touched[key] ? errors[key] : undefined;
  }

  function setProof(file: File | null) {
    setProofFile(file);
    markTouched("proof");
    setProofPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function updateDetail<K extends keyof CheckoutDetails>(
    key: K,
    value: CheckoutDetails[K],
  ) {
    setDetails((prev) => ({ ...prev, [key]: value }));
    markTouched(key);
  }

  function handleDetailsNext(event: FormEvent) {
    event.preventDefault();
    setTouched((prev) => ({
      ...prev,
      fullName: true,
      phone: true,
      address: true,
      zoneId: true,
    }));
    if (!detailsValid) return;
    setStep(2);
  }

  async function handlePaymentSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched((prev) => ({ ...prev, reference: true, proof: true }));
    if (!paymentValid || !proofFile) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const id = await submitOrder({
        fullName: details.fullName,
        phone: details.phone,
        address: details.address,
        zoneId: details.zoneId,
        notes: details.notes,
        paymentReference: reference,
        proofFile,
        items: items.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      });
      setOrderId(id);
      setStep(3);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not place order. Please try again.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyAccount(accountNumber: string) {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccount(accountNumber);
      window.setTimeout(() => setCopiedAccount(null), 1600);
    } catch {
      setCopiedAccount(null);
    }
  }

  if (items.length === 0 && step !== 3) {
    return (
      <section className="checkout-page">
        <div className="cart-empty">
          <p>Your cart is empty. Add packs before checking out.</p>
          <button
            type="button"
            className="cart-primary-btn"
            onClick={onBackToCart}
          >
            Back to cart
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page" aria-labelledby="checkout-heading">
      <div className="checkout-header">
        <button type="button" className="back-link" onClick={onBackToCart}>
          ← Cart
        </button>
        <h1 id="checkout-heading" className="checkout-title">
          Checkout
        </h1>
        <ol className="checkout-steps" aria-label="Checkout progress">
          <li
            className={step >= 1 ? "is-active" : ""}
            aria-current={step === 1 ? "step" : undefined}
          >
            <span>1</span> Details
          </li>
          <li
            className={step >= 2 ? "is-active" : ""}
            aria-current={step === 2 ? "step" : undefined}
          >
            <span>2</span> Payment
          </li>
          <li
            className={step >= 3 ? "is-active" : ""}
            aria-current={step === 3 ? "step" : undefined}
          >
            <span>3</span> Done
          </li>
        </ol>
      </div>

      <aside className="checkout-summary" aria-label="Order summary">
        <h2 className="checkout-summary-title">Order summary</h2>

        <ul className="checkout-summary-lines">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="checkout-summary-line">
              <img
                src={product.image}
                alt=""
                className="checkout-summary-thumb"
                width={44}
                height={62}
              />
              <div className="checkout-summary-line-copy">
                <span className="checkout-summary-line-name">
                  {product.name}
                </span>
                <span className="checkout-summary-line-qty">
                  Qty {quantity}
                </span>
              </div>
              <strong className="checkout-summary-amount">
                {formatNu(product.price * quantity)}
              </strong>
            </li>
          ))}
        </ul>

        <div className="checkout-summary-totals">
          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span className="checkout-summary-amount">
              {formatNu(subtotal)}
            </span>
          </div>
          <div className="checkout-summary-row">
            <span>GST ({gstPercent}%)</span>
            <span className="checkout-summary-amount">{formatNu(gst)}</span>
          </div>
          <div className="checkout-summary-row">
            <span>Shipping · {zone?.label ?? "—"}</span>
            <span className="checkout-summary-amount">
              {shipping === 0 ? "Free" : formatNu(shipping)}
            </span>
          </div>
          <div className="checkout-summary-row is-total">
            <span>Payable</span>
            <strong className="checkout-summary-amount">
              {formatNu(grandTotal)}
            </strong>
          </div>
        </div>
      </aside>

      {step === 1 && (
        <form className="checkout-form" onSubmit={handleDetailsNext} noValidate>
          <h2 className="checkout-form-title">Delivery details</h2>
          <p className="checkout-form-lead">
            We deliver within Bhutan. Thimphu is free; Paro is our cheapest paid
            zone.{" "}
            <cite>
              (Fields marked <RequiredMark /> are required.)
            </cite>
          </p>

          <label className="field" htmlFor={`${formId}-name`}>
            <span className="field-label">
              Full name <RequiredMark />
            </span>
            <input
              id={`${formId}-name`}
              type="text"
              autoComplete="name"
              value={details.fullName}
              aria-required="true"
              aria-invalid={Boolean(fieldError("fullName", detailsErrors))}
              onChange={(event) => updateDetail("fullName", event.target.value)}
              onBlur={() => markTouched("fullName")}
            />
            {fieldError("fullName", detailsErrors) && (
              <span className="field-error">{detailsErrors.fullName}</span>
            )}
          </label>

          <label className="field" htmlFor={`${formId}-phone`}>
            <span className="field-label">
              Contact number <RequiredMark />
            </span>
            <input
              id={`${formId}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 17xxxxxx"
              value={details.phone}
              aria-required="true"
              aria-invalid={Boolean(fieldError("phone", detailsErrors))}
              onChange={(event) => updateDetail("phone", event.target.value)}
              onBlur={() => markTouched("phone")}
            />
            {fieldError("phone", detailsErrors) && (
              <span className="field-error">{detailsErrors.phone}</span>
            )}
          </label>

          <label className="field" htmlFor={`${formId}-address`}>
            <span className="field-label">
              Delivery address <RequiredMark />
            </span>
            <textarea
              id={`${formId}-address`}
              rows={3}
              placeholder="Building / street, area, landmark"
              value={details.address}
              aria-required="true"
              aria-invalid={Boolean(fieldError("address", detailsErrors))}
              onChange={(event) => updateDetail("address", event.target.value)}
              onBlur={() => markTouched("address")}
            />
            {fieldError("address", detailsErrors) && (
              <span className="field-error">{detailsErrors.address}</span>
            )}
          </label>

          <fieldset className="shipping-fieldset">
            <legend className="shipping-legend">
              Delivery zone <RequiredMark />
            </legend>
            <div className="shipping-options">
              {shippingZones.map((option) => (
                <label
                  key={option.id}
                  className={`shipping-option${details.zoneId === option.id ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="checkout-zone"
                    value={option.id}
                    checked={details.zoneId === option.id}
                    onChange={() => updateDetail("zoneId", option.id)}
                  />
                  <span className="shipping-option-copy">
                    <span className="shipping-option-label">
                      {option.label}
                    </span>
                    <span className="shipping-option-detail">
                      {option.detail}
                    </span>
                  </span>
                  <span className="shipping-option-fee">
                    {option.fee === 0 ? "Free" : formatNu(option.fee)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field" htmlFor={`${formId}-notes`}>
            <span className="field-label">Notes (optional)</span>
            <textarea
              id={`${formId}-notes`}
              rows={2}
              placeholder="Gate code, preferred call time, etc."
              value={details.notes}
              onChange={(event) => updateDetail("notes", event.target.value)}
            />
          </label>

          <button
            type="submit"
            className="cart-primary-btn"
            disabled={!detailsValid}
            aria-disabled={!detailsValid}
          >
            Next
          </button>
        </form>
      )}

      {step === 2 && (
        <form
          className="checkout-form"
          onSubmit={handlePaymentSubmit}
          noValidate
        >
          <h2 className="checkout-form-title">Pay by bank transfer</h2>
          <p className="checkout-form-lead">
            Scan the shop QR or transfer to a BOB / BNB account, then upload
            your payment proof.{" "}
            <cite>
              (Fields marked <RequiredMark /> are required.)
            </cite>
          </p>

          <div className="payment-qr-block">
            <img
              src={settings.paymentQrUrl}
              alt="Cortez TCG Live bank payment QR code"
              className="payment-qr"
              width={220}
              height={220}
            />
            <p className="payment-qr-note">
              Amount due: <strong>{formatNu(grandTotal)}</strong>
            </p>
          </div>

          <ul className="payment-accounts">
            {settings.paymentAccounts.map((account) => (
              <li key={account.accountNumber} className="payment-account">
                <div>
                  <p className="payment-bank">{account.bank}</p>
                  <p className="payment-account-name">{account.accountName}</p>
                  <p className="payment-account-number">
                    {account.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyAccount(account.accountNumber)}
                >
                  {copiedAccount === account.accountNumber ? "Copied" : "Copy"}
                </button>
              </li>
            ))}
          </ul>

          <label className="field" htmlFor={`${formId}-ref`}>
            <span className="field-label">
              Transaction / reference number <RequiredMark />
            </span>
            <input
              id={`${formId}-ref`}
              type="text"
              value={reference}
              aria-required="true"
              aria-invalid={Boolean(fieldError("reference", paymentErrors))}
              onChange={(event) => {
                setReference(event.target.value);
                markTouched("reference");
              }}
              onBlur={() => markTouched("reference")}
              placeholder="From your BOB / BNB transfer"
            />
            {fieldError("reference", paymentErrors) && (
              <span className="field-error">{paymentErrors.reference}</span>
            )}
          </label>

          <label className="field" htmlFor={`${formId}-proof`}>
            <span className="field-label">
              Payment screenshot <RequiredMark />
            </span>
            <input
              id={`${formId}-proof`}
              type="file"
              accept="image/*"
              aria-required="true"
              aria-invalid={Boolean(fieldError("proof", paymentErrors))}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setProof(file);
              }}
              onBlur={() => markTouched("proof")}
            />
            {fieldError("proof", paymentErrors) && (
              <span className="field-error">{paymentErrors.proof}</span>
            )}
          </label>

          {proofPreview && (
            <img
              src={proofPreview}
              alt="Payment screenshot preview"
              className="proof-preview"
            />
          )}

          {submitError && (
            <p className="field-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="checkout-actions">
            <button
              type="button"
              className="cart-secondary-btn"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              Back
            </button>
            <button
              type="submit"
              className="cart-primary-btn"
              disabled={!paymentValid || submitting}
              aria-disabled={!paymentValid || submitting}
            >
              {submitting ? "Placing order…" : "Place order"}
            </button>
          </div>
        </form>
      )}

      {step === 3 && orderId && (
        <div className="checkout-confirm">
          <p className="confirm-kicker">Order received</p>
          <h2 className="confirm-title">
            Thank you, {details.fullName.split(" ")[0] || "crew"}!
          </h2>
          <p className="confirm-copy">
            We&apos;ll verify your transfer and confirm shipping to{" "}
            <strong>{zone?.label ?? "your zone"}</strong>. Keep this page&apos;s
            screenshot and order ID for WhatsApp or call support.
          </p>
          <p className="confirm-order-id">{orderId}</p>
          <dl className="confirm-meta">
            <div>
              <dt>Phone</dt>
              <dd>{details.phone}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{details.address}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{formatNu(grandTotal)}</dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd>{reference}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="cart-primary-btn"
            onClick={onOrderComplete}
          >
            Back to store
          </button>
        </div>
      )}
    </section>
  );
}
