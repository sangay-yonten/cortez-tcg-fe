/** Display helper for Bhutanese Ngultrum (BTN). */
export function formatNu(amount: number) {
  const rounded = Math.round(amount);
  return `Nu. ${rounded.toLocaleString("en-BT")}`;
}

/** Default Bhutan GST rate when shop settings are unavailable. */
export const GST_RATE = 0.05;

export function calcGst(subtotal: number, gstRate: number = GST_RATE) {
  return Math.round(subtotal * gstRate);
}

export function calcCartTotal(subtotal: number, gstRate: number = GST_RATE) {
  return subtotal + calcGst(subtotal, gstRate);
}
