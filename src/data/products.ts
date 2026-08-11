import op05 from '../assets/products/op05.png'
import op06 from '../assets/products/op06.png'
import op07 from '../assets/products/op07.png'
import op08 from '../assets/products/op08.png'

export type ProductBadge = 'hot' | 'favorite' | 'new'

export type Product = {
  id: string
  name: string
  shortName: string
  /** Price in Bhutanese Ngultrum (BTN). */
  price: number
  compareAt?: number
  image: string
  badge?: ProductBadge
}

export const products: Product[] = [
  {
    id: 'op-05',
    name: 'One Piece TCG OP-05: Awakening of the New Era Booster Pack',
    shortName: 'OP-05 Awakening',
    price: 95,
    image: op05,
    badge: 'favorite',
  },
  {
    id: 'op-06',
    name: 'One Piece TCG OP-06: Wings of the Captain Booster Pack',
    shortName: 'OP-06 Wings',
    price: 95,
    image: op06,
    badge: 'hot',
  },
  {
    id: 'op-07',
    name: 'One Piece TCG OP-07: 500 Years in the Future Booster Pack',
    shortName: 'OP-07 Future',
    price: 81,
    compareAt: 95,
    image: op07,
    badge: 'hot',
  },
  {
    id: 'op-08',
    name: 'One Piece TCG OP-08: Two Legends Booster Pack',
    shortName: 'OP-08 Legends',
    price: 95,
    image: op08,
    badge: 'new',
  },
  {
    id: 'op-09',
    name: 'One Piece TCG OP-09: Emperors in the New World Booster Pack',
    shortName: 'OP-09 Emperors',
    price: 88,
    compareAt: 95,
    image: op05,
    badge: 'hot',
  },
  {
    id: 'op-01',
    name: 'One Piece TCG OP-01: Romance Dawn Booster Pack',
    shortName: 'OP-01 Romance',
    price: 122,
    image: op06,
    badge: 'favorite',
  },
  {
    id: 'op-02',
    name: 'One Piece TCG OP-02: Paramount War Booster Pack',
    shortName: 'OP-02 Paramount',
    price: 102,
    image: op07,
  },
  {
    id: 'op-03',
    name: 'One Piece TCG OP-03: Pillars of Strength Booster Pack',
    shortName: 'OP-03 Pillars',
    price: 95,
    image: op08,
  },
  {
    id: 'op-04',
    name: 'One Piece TCG OP-04: Kingdoms of Intrigue Booster Pack',
    shortName: 'OP-04 Kingdoms',
    price: 95,
    image: op05,
  },
  {
    id: 'op-10',
    name: 'One Piece TCG OP-10: Royal Blood Booster Pack',
    shortName: 'OP-10 Royal',
    price: 95,
    image: op06,
    badge: 'new',
  },
  {
    id: 'eb-01',
    name: 'One Piece TCG EB-01: Memorial Collection Booster Pack',
    shortName: 'EB-01 Memorial',
    price: 109,
    compareAt: 122,
    image: op07,
    badge: 'hot',
  },
  {
    id: 'op-11',
    name: 'One Piece TCG OP-11: A Fist of Divine Speed Booster Pack',
    shortName: 'OP-11 Divine',
    price: 95,
    image: op08,
  },
  {
    id: 'st-01',
    name: 'One Piece TCG ST-01: Straw Hat Crew Starter Deck',
    shortName: 'ST-01 Straw Hat',
    price: 272,
    compareAt: 340,
    image: op05,
    badge: 'favorite',
  },
  {
    id: 'st-02',
    name: 'One Piece TCG ST-02: Worst Generation Starter Deck',
    shortName: 'ST-02 Worst Gen',
    price: 272,
    image: op06,
  },
  {
    id: 'op-12',
    name: 'One Piece TCG OP-12: Legacy of the Master Booster Pack',
    shortName: 'OP-12 Legacy',
    price: 95,
    image: op07,
    badge: 'new',
  },
  {
    id: 'prb-01',
    name: 'One Piece TCG PRB-01: Premium Booster The Best',
    shortName: 'PRB-01 The Best',
    price: 204,
    compareAt: 231,
    image: op08,
    badge: 'favorite',
  },
  {
    id: 'op-05b',
    name: 'One Piece TCG OP-05: Awakening of the New Era (Case Break Slot)',
    shortName: 'OP-05 Slot',
    price: 68,
    compareAt: 95,
    image: op05,
    badge: 'hot',
  },
  {
    id: 'op-06b',
    name: 'One Piece TCG OP-06: Wings of the Captain (Live Rip Slot)',
    shortName: 'OP-06 Live Slot',
    price: 75,
    compareAt: 95,
    image: op06,
    badge: 'hot',
  },
  {
    id: 'op-08b',
    name: 'One Piece TCG OP-08: Two Legends Special Art Bundle',
    shortName: 'OP-08 Art Bundle',
    price: 407,
    image: op08,
    badge: 'favorite',
  },
  {
    id: 'op-09b',
    name: 'One Piece TCG OP-09: Emperors Multi-Pack Bundle (5)',
    shortName: 'OP-09 5-Pack',
    price: 435,
    compareAt: 475,
    image: op05,
    badge: 'hot',
  },
]

export const trendingProducts = products.filter(
  (product) => product.badge === 'hot' || product.badge === 'favorite',
)

export const PAGE_SIZE = 10

export function getProductById(id: string) {
  return products.find((product) => product.id === id)
}
