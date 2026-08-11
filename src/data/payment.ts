export type BankAccount = {
  bank: string
  accountName: string
  accountNumber: string
}

/** Replace these with the shop’s real BOB / BNB details + QR asset. */
export const paymentAccounts: BankAccount[] = [
  {
    bank: 'Bank of Bhutan (BOB)',
    accountName: 'Cortez TCG Live',
    accountNumber: '0001234567890',
  },
  {
    bank: 'Bhutan National Bank (BNB)',
    accountName: 'Cortez TCG Live',
    accountNumber: '1009876543210',
  },
]

export function createOrderId() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.floor(Math.random() * 90 + 10)
  return `CTL-${stamp}${rand}`
}
