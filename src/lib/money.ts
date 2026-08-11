/** Display helper for Bhutanese Ngultrum (BTN). */
export function formatNu(amount: number) {
  const rounded = Math.round(amount)
  return `Nu. ${rounded.toLocaleString('en-BT')}`
}

/** Bhutan GST rate applied on cart subtotal (exclusive prices). */
export const GST_RATE = 0.05

export function calcGst(subtotal: number) {
  return Math.round(subtotal * GST_RATE)
}

export function calcCartTotal(subtotal: number) {
  return subtotal + calcGst(subtotal)
}
