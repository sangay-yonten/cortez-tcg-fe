export type ShippingZoneId = string

export type ShippingZone = {
  id: ShippingZoneId
  label: string
  detail: string
  fee: number
}

export const shippingZones: ShippingZone[] = [
  {
    id: 'thimphu',
    label: 'Thimphu',
    detail: 'Free delivery within Thimphu · 1–2 days',
    fee: 0,
  },
  {
    id: 'paro',
    label: 'Paro',
    detail: 'Lowest courier rate · 1–3 days',
    fee: 50,
  },
  {
    id: 'rest-bhutan',
    label: 'Rest of Bhutan',
    detail: 'Domestic courier · 2–5 days',
    fee: 150,
  },
]

export const DEFAULT_SHIPPING_ZONE: ShippingZoneId = 'thimphu'

export function getShippingZone(id: ShippingZoneId) {
  return shippingZones.find((zone) => zone.id === id) ?? shippingZones[0]
}
