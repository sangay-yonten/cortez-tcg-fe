import type { Product, ProductCategory } from "../data/products";
import {
  homeHighlightIsVisible,
  type HomeHighlightAction,
} from "../lib/homeHighlight";
import { formatNu } from "../lib/money";
import { useShop } from "../lib/ShopContext";
import {
  formatStreamWhen,
  sortStreamsByPriority,
  streamStatusLabel,
} from "../lib/streamSchedule";
import CategoryCards from "./CategoryCards";
import { CartIcon } from "./Icons";
import CoverCarousel from "./CoverCarousel";
import { DealRailSkeleton, StreamRailSkeleton } from "./Skeleton";
import StreamWatchLinks from "./StreamWatchLinks";

const HOME_DEAL_LIMIT = 6;
const HOME_STREAM_LIMIT = 6;

type HomePageProps = {
  addedId: string | null;
  onAddToCart: (id: string) => void;
  onOpenCatalog: (category: ProductCategory) => void;
  onOpenShop: () => void;
  onOpenSchedule: () => void;
};

function badgeLabel(badge: Product["badge"]) {
  if (badge === "hot") return "Hot deal";
  if (badge === "favorite") return "Crew favorite";
  if (badge === "new") return "New";
  return null;
}

function runHighlightAction(
  action: HomeHighlightAction,
  url: string | null | undefined,
  onOpenSchedule: () => void,
  onOpenShop: () => void,
) {
  if (action === "schedule") {
    onOpenSchedule();
    return;
  }
  if (action === "shop") {
    onOpenShop();
    return;
  }
  const href = url?.trim();
  if (href) window.open(href, "_blank", "noopener,noreferrer");
}

export default function HomePage({
  addedId,
  onAddToCart,
  onOpenCatalog,
  onOpenShop,
  onOpenSchedule,
}: HomePageProps) {
  const { products, streams, settings, loading, ready } = useShop();
  const highlight = settings.homeHighlight;
  const showHighlight = homeHighlightIsVisible(highlight);
  const showSkeletons = !ready;
  const trendingProducts = products
    .filter(
      (product) => product.badge === "hot" || product.badge === "favorite",
    )
    .slice(0, HOME_DEAL_LIMIT);
  const orderedStreams = sortStreamsByPriority(streams)
    .filter((stream) => stream.status !== "ended")
    .slice(0, HOME_STREAM_LIMIT);

  return (
    <>
      <section className="bio" id="bio" aria-labelledby="bio-heading">
        <div className="bio-frame">
          <CoverCarousel />
        </div>

        <h1 id="bio-heading" className="bio-title">
          Welcome to Cortez TCG Live
        </h1>
        <p className="bio-copy">
          Fueling the One Piece TCG community with live pack rips, rare single
          cards and interactive giveaways. We stream every break live so you can
          watch your pulls happen in real time—packed carefully and shipped
          straight to you.
        </p>
      </section>

      <CategoryCards onSelect={onOpenCatalog} />

      {showHighlight && (
        <section className="viral" id="viral" aria-labelledby="viral-heading">
          <div className="viral-card">
            {highlight.kicker.trim() ? (
              <p className="viral-kicker">{highlight.kicker}</p>
            ) : null}
            {highlight.title.trim() ? (
              <h2 id="viral-heading" className="viral-title">
                {highlight.title}
              </h2>
            ) : (
              <h2 id="viral-heading" className="sr-only">
                Highlight
              </h2>
            )}
            {highlight.body.trim() ? (
              <p className="viral-copy">{highlight.body}</p>
            ) : null}
            {(highlight.primaryLabel.trim() ||
              highlight.secondaryLabel.trim()) && (
              <div className="viral-actions">
                {highlight.primaryLabel.trim() ? (
                  <button
                    type="button"
                    className="viral-primary"
                    onClick={() =>
                      runHighlightAction(
                        highlight.primaryAction,
                        highlight.primaryUrl,
                        onOpenSchedule,
                        onOpenShop,
                      )
                    }
                  >
                    {highlight.primaryLabel}
                  </button>
                ) : null}
                {highlight.secondaryLabel.trim() ? (
                  <button
                    type="button"
                    className="viral-secondary"
                    onClick={() =>
                      runHighlightAction(
                        highlight.secondaryAction,
                        highlight.secondaryUrl,
                        onOpenSchedule,
                        onOpenShop,
                      )
                    }
                  >
                    {highlight.secondaryLabel}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </section>
      )}

      <section
        className="rail-section"
        id="streams"
        aria-labelledby="streams-heading"
      >
        <div className="rail-header">
          <div>
            <h2 id="streams-heading" className="rail-title">
              Upcoming Streams
            </h2>
            <p className="rail-subtitle">
              {showSkeletons
                ? "Loading schedule…"
                : "Daily openings worth setting a reminder for"}
            </p>
          </div>
        </div>

        {showSkeletons ? (
          <StreamRailSkeleton />
        ) : (
          <ul className="rail" aria-label="Upcoming live streams">
            {orderedStreams.map((stream) => {
              const hasLinks = (stream.streamUrls?.length ?? 0) > 0;
              const isLive = stream.status === "live";
              return (
                <li
                  key={stream.id}
                  className={`stream-card${stream.status === "ended" ? " is-ended" : ""}${isLive && hasLinks ? " is-live-link" : ""}`}
                >
                  <div className="stream-top">
                    <span className={`stream-status is-${stream.status}`}>
                      {streamStatusLabel(stream.status)}
                    </span>
                    <span className="stream-when">
                      {formatStreamWhen(stream)}
                    </span>
                  </div>
                  <h3 className="stream-title">{stream.title}</h3>
                  <p className="stream-focus">{stream.focus}</p>
                  <StreamWatchLinks
                    urls={stream.streamUrls}
                    emphasizeLive={isLive}
                  />
                </li>
              );
            })}
            <li className="rail-more">
              <button
                type="button"
                className="rail-more-btn"
                onClick={onOpenSchedule}
              >
                <span className="rail-more-label">View all</span>
                <span className="rail-more-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          </ul>
        )}
      </section>

      <section
        className="rail-section"
        id="deals"
        aria-labelledby="deals-heading"
      >
        <div className="rail-header">
          <div>
            <h2 id="deals-heading" className="rail-title">
              Hot Deals & Favorites
            </h2>
            <p className="rail-subtitle">
              {showSkeletons
                ? "Loading live picks…"
                : loading
                  ? "Refreshing picks…"
                  : "Trending picks the nakama keeps reordering"}
            </p>
          </div>
        </div>

        {showSkeletons ? (
          <DealRailSkeleton />
        ) : (
          <ul className="rail" aria-label="Trending products">
            {trendingProducts.map((product) => {
              const label = badgeLabel(product.badge);
              const outOfStock = product.stock != null && product.stock <= 0;
              return (
                <li key={product.id} className="deal-card">
                  {label && (
                    <span className={`deal-badge is-${product.badge}`}>
                      {label}
                    </span>
                  )}
                  <img
                    src={product.image}
                    alt=""
                    className="deal-image"
                    width={120}
                    height={170}
                  />
                  <h3 className="deal-name">{product.name}</h3>
                  <p className="deal-price">
                    {product.compareAt != null && (
                      <span className="deal-compare">
                        {formatNu(product.compareAt)}
                      </span>
                    )}
                    <span>{formatNu(product.price)}</span>
                  </p>
                  <button
                    type="button"
                    className={`add-btn compact${addedId === product.id ? " is-added" : ""}`}
                    disabled={outOfStock}
                    onClick={() => onAddToCart(product.id)}
                  >
                    <span>
                      {outOfStock
                        ? "Sold out"
                        : addedId === product.id
                          ? "Added"
                          : "Add"}
                    </span>
                    <CartIcon />
                  </button>
                </li>
              );
            })}
            <li className="rail-more">
              <button
                type="button"
                className="rail-more-btn"
                onClick={onOpenShop}
              >
                <span className="rail-more-label">View all</span>
                <span className="rail-more-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            </li>
          </ul>
        )}
      </section>
    </>
  );
}
