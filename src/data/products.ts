import placeholderImage from '../assets/product-placeholder.svg'

export type ProductBadge = 'hot' | 'favorite' | 'new'

/** Add a new entry here (+ DB enum) to unlock a shop category on the FE. */
export const CATEGORY_DEFS = [
  {
    id: 'loose_pack',
    label: 'Loose Packs',
    blurb: 'Singles packs & live rip slots',
  },
  {
    id: 'raw_card',
    label: 'Raw Mint Cards',
    blurb: 'Grading-ready NM singles',
  },
  {
    id: 'booster_box',
    label: 'Booster Boxes',
    blurb: 'Sealed boxes · pack count varies',
  },
] as const

export type ProductCategory = (typeof CATEGORY_DEFS)[number]['id']

export type ProductCardDetails = {
  setCode?: string
  cardNumber?: string
  rarity?: string
  condition?: string
  language?: string
}

export type ProductBoxDetails = {
  packsPerBox?: number
  sealed?: boolean
}

export type ProductPackDetails = {
  setCode?: string
}

export type Product = {
  id: string
  name: string
  /** Price in Bhutanese Ngultrum (BTN). */
  price: number
  compareAt?: number
  image: string
  badge?: ProductBadge
  category: ProductCategory
  /** Available units when loaded from Supabase; optional for local fallback. */
  stock?: number
  isActive?: boolean
  cardDetails?: ProductCardDetails
  boxDetails?: ProductBoxDetails
  packDetails?: ProductPackDetails
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = Object.fromEntries(
  CATEGORY_DEFS.map((category) => [category.id, category.label]),
) as Record<ProductCategory, string>

/** Categories present in the live catalog, preserving CATEGORY_DEFS order. */
export function categoriesFromProducts(items: Product[]): ProductCategory[] {
  const present = new Set(items.map((item) => item.category))
  return CATEGORY_DEFS.map((category) => category.id).filter((id) =>
    present.has(id),
  )
}

/** All configured shop categories (including empty ones). */
export function allShopCategories(): ProductCategory[] {
  return CATEGORY_DEFS.map((category) => category.id)
}

export function getCategoryDef(id: ProductCategory) {
  return CATEGORY_DEFS.find((category) => category.id === id) ?? CATEGORY_DEFS[0]
}

export const products: Product[] = [
  {
    id: 'op-05',
    name: 'OP-05 Awakening',
    price: 95,
    image: placeholderImage,
    badge: 'favorite',
    category: 'loose_pack',
  },
  {
    id: 'op-06',
    name: 'OP-06 Wings',
    price: 95,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'op-07',
    name: 'OP-07 Future',
    price: 81,
    compareAt: 95,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'op-08',
    name: 'OP-08 Legends',
    price: 95,
    image: placeholderImage,
    badge: 'new',
    category: 'loose_pack',
  },
  {
    id: 'op-09',
    name: 'OP-09 Emperors',
    price: 88,
    compareAt: 95,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'op-01',
    name: 'OP-01 Romance',
    price: 122,
    image: placeholderImage,
    badge: 'favorite',
    category: 'loose_pack',
  },
  {
    id: 'op-02',
    name: 'OP-02 Paramount',
    price: 102,
    image: placeholderImage,
    category: 'loose_pack',
  },
  {
    id: 'op-03',
    name: 'OP-03 Pillars',
    price: 95,
    image: placeholderImage,
    category: 'loose_pack',
  },
  {
    id: 'op-04',
    name: 'OP-04 Kingdoms',
    price: 95,
    image: placeholderImage,
    category: 'loose_pack',
  },
  {
    id: 'op-10',
    name: 'OP-10 Royal',
    price: 95,
    image: placeholderImage,
    badge: 'new',
    category: 'loose_pack',
  },
  {
    id: 'eb-01',
    name: 'EB-01 Memorial',
    price: 109,
    compareAt: 122,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'op-11',
    name: 'OP-11 Divine',
    price: 95,
    image: placeholderImage,
    category: 'loose_pack',
  },
  {
    id: 'st-01',
    name: 'ST-01 Straw Hat',
    price: 272,
    compareAt: 340,
    image: placeholderImage,
    badge: 'favorite',
    category: 'loose_pack',
  },
  {
    id: 'st-02',
    name: 'ST-02 Worst Gen',
    price: 272,
    image: placeholderImage,
    category: 'loose_pack',
  },
  {
    id: 'op-12',
    name: 'OP-12 Legacy',
    price: 95,
    image: placeholderImage,
    badge: 'new',
    category: 'loose_pack',
  },
  {
    id: 'prb-01',
    name: 'PRB-01 The Best',
    price: 204,
    compareAt: 231,
    image: placeholderImage,
    badge: 'favorite',
    category: 'loose_pack',
  },
  {
    id: 'op-05b',
    name: 'OP-05 Slot',
    price: 68,
    compareAt: 95,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'op-06b',
    name: 'OP-06 Live Slot',
    price: 75,
    compareAt: 95,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'op-08b',
    name: 'OP-08 Art Bundle',
    price: 407,
    image: placeholderImage,
    badge: 'favorite',
    category: 'loose_pack',
  },
  {
    id: 'op-09b',
    name: 'OP-09 5-Pack',
    price: 435,
    compareAt: 475,
    image: placeholderImage,
    badge: 'hot',
    category: 'loose_pack',
  },
  {
    id: 'raw-luffy-op05',
    name: 'Luffy OP05 NM',
    price: 450,
    compareAt: 520,
    image: placeholderImage,
    badge: 'hot',
    category: 'raw_card',
    stock: 3,
    cardDetails: { setCode: 'OP-05', rarity: 'SR', condition: 'NM', language: 'EN' },
  },
  {
    id: 'raw-zoro-op06',
    name: 'Zoro OP06 NM',
    price: 280,
    image: placeholderImage,
    badge: 'favorite',
    category: 'raw_card',
    stock: 5,
    cardDetails: { setCode: 'OP-06', rarity: 'SR', condition: 'NM', language: 'EN' },
  },
  {
    id: 'raw-nami-op07',
    name: 'Nami OP07 NM',
    price: 160,
    compareAt: 190,
    image: placeholderImage,
    badge: 'new',
    category: 'raw_card',
    stock: 8,
    cardDetails: { setCode: 'OP-07', rarity: 'R', condition: 'NM', language: 'EN' },
  },
  {
    id: 'raw-shanks-op09',
    name: 'Shanks OP09 AA',
    price: 1200,
    image: placeholderImage,
    badge: 'hot',
    category: 'raw_card',
    stock: 1,
    cardDetails: { setCode: 'OP-09', rarity: 'SEC', condition: 'NM', language: 'EN' },
  },
  {
    id: 'box-op05',
    name: 'OP-05 Box',
    price: 2100,
    compareAt: 2300,
    image: placeholderImage,
    badge: 'favorite',
    category: 'booster_box',
    stock: 4,
    boxDetails: { packsPerBox: 24, sealed: true },
  },
  {
    id: 'box-op06',
    name: 'OP-06 Box',
    price: 2050,
    image: placeholderImage,
    badge: 'hot',
    category: 'booster_box',
    stock: 3,
    boxDetails: { packsPerBox: 24, sealed: true },
  },
  {
    id: 'box-op08',
    name: 'OP-08 Box',
    price: 2200,
    compareAt: 2400,
    image: placeholderImage,
    badge: 'new',
    category: 'booster_box',
    stock: 2,
    boxDetails: { packsPerBox: 24, sealed: true },
  },
]

export const trendingProducts = products.filter(
  (product) => product.badge === 'hot' || product.badge === 'favorite',
)

export const PAGE_SIZE = 10

export function getProductById(id: string) {
  return products.find((product) => product.id === id)
}
