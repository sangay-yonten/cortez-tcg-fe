import { PAGE_SIZE, products } from '../data/products'
import { formatNu } from '../lib/money'
import { CartIcon } from './Icons'

type LoosePacksPageProps = {
  page: number
  addedId: string | null
  onAddToCart: (id: string) => void
  onPageChange: (page: number) => void
  onBackHome: () => void
}

export default function LoosePacksPage({
  page,
  addedId,
  onAddToCart,
  onPageChange,
  onBackHome,
}: LoosePacksPageProps) {
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const visible = products.slice(start, start + PAGE_SIZE)

  return (
    <section className="packs-page" aria-labelledby="packs-page-heading">
      <div className="packs-page-header">
        <button type="button" className="back-link" onClick={onBackHome}>
          ← Home
        </button>
        <h1 id="packs-page-heading" className="packs-page-title">
          Available Loose Packs
        </h1>
        <p className="packs-page-meta">
          Showing {start + 1}–{Math.min(start + PAGE_SIZE, products.length)} of{' '}
          {products.length} · GST added at checkout
        </p>
      </div>

      <ul className="product-grid">
        {visible.map((product) => (
          <li key={product.id} className="product-card">
            <div className="product-media">
              <img src={product.image} alt="" className="product-image" />
            </div>
            <h2 className="product-name">{product.name}</h2>
            <p className="product-price">
              {product.compareAt != null && (
                <span className="deal-compare">{formatNu(product.compareAt)}</span>
              )}
              <span>{formatNu(product.price)}</span>
            </p>
            <button
              type="button"
              className={`add-btn${addedId === product.id ? ' is-added' : ''}`}
              onClick={() => onAddToCart(product.id)}
            >
              <span>{addedId === product.id ? 'Added' : 'Add to Cart'}</span>
              <CartIcon />
            </button>
          </li>
        ))}
      </ul>

      <div className="pagination">
        <button
          type="button"
          className="pagination-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </button>
        <p className="pagination-status">
          Page {safePage} of {totalPages}
        </p>
        <button
          type="button"
          className="pagination-btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  )
}
