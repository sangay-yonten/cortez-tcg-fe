import { trendingProducts, type Product } from "../data/products";
import { streams } from "../data/streams";
import { formatNu } from "../lib/money";
import { CartIcon } from "./Icons";
import CoverCarousel from "./CoverCarousel";

type HomePageProps = {
  addedId: string | null;
  onAddToCart: (id: string) => void;
  onSeeAllPacks: () => void;
  onBrowseStreams: () => void;
};

function badgeLabel(badge: Product["badge"]) {
  if (badge === "hot") return "Hot deal";
  if (badge === "favorite") return "Crew favorite";
  if (badge === "new") return "New";
  return null;
}

export default function HomePage({
  addedId,
  onAddToCart,
  onSeeAllPacks,
  onBrowseStreams,
}: HomePageProps) {
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

      <section className="viral" id="viral" aria-labelledby="viral-heading">
        <div className="viral-card">
          <p className="viral-kicker">Going viral</p>
          <h2 id="viral-heading" className="viral-title">
            Last night&apos;s OP-05 chase hit 40K views
          </h2>
          <p className="viral-copy">
            Manga rare pulled live on stream — catch the replay, then lock a
            slot for tonight&apos;s opening.
          </p>
          <div className="viral-actions">
            <button
              type="button"
              className="viral-primary"
              onClick={onBrowseStreams}
            >
              Watch schedule
            </button>
            <button
              type="button"
              className="viral-secondary"
              onClick={onSeeAllPacks}
            >
              Shop latest packs
            </button>
          </div>
        </div>
      </section>

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
              Daily openings worth setting a reminder for
            </p>
          </div>
        </div>

        <ul className="rail" aria-label="Upcoming live streams">
          {streams.map((stream) => (
            <li key={stream.id} className="stream-card">
              <div className="stream-top">
                <span className={`stream-status is-${stream.status}`}>
                  {stream.status === "live"
                    ? "Live"
                    : stream.status === "tonight"
                      ? "Tonight"
                      : "Upcoming"}
                </span>
                <span className="stream-when">
                  {stream.day} · {stream.time}
                </span>
              </div>
              <h3 className="stream-title">{stream.title}</h3>
              <p className="stream-focus">{stream.focus}</p>
            </li>
          ))}
        </ul>
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
              Trending picks the nakama keeps reordering
            </p>
          </div>
          <button type="button" className="see-all-btn" onClick={onSeeAllPacks}>
            See all
          </button>
        </div>

        <ul className="rail" aria-label="Trending products">
          {trendingProducts.map((product) => {
            const label = badgeLabel(product.badge);
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
                <h3 className="deal-name">{product.shortName}</h3>
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
                  onClick={() => onAddToCart(product.id)}
                >
                  <span>{addedId === product.id ? "Added" : "Add"}</span>
                  <CartIcon />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
