import type { CSSProperties } from "react";

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
}

export function StreamRailSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="rail" aria-busy="true" aria-label="Loading streams">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="stream-card skeleton-card">
          <div className="stream-top">
            <Skeleton className="skeleton-pill" />
            <Skeleton className="skeleton-line is-short" />
          </div>
          <Skeleton className="skeleton-line is-title" />
          <Skeleton className="skeleton-line" />
          <Skeleton className="skeleton-line is-mid" />
        </li>
      ))}
    </ul>
  );
}

export function DealRailSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="rail" aria-busy="true" aria-label="Loading deals">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="deal-card skeleton-card">
          <Skeleton className="skeleton-media" />
          <Skeleton className="skeleton-line is-title" />
          <Skeleton className="skeleton-line is-short" />
          <Skeleton className="skeleton-btn" />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="product-grid" aria-busy="true" aria-label="Loading catalog">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="product-card skeleton-card">
          <Skeleton className="skeleton-media is-product" />
          <Skeleton className="skeleton-line is-title" />
          <Skeleton className="skeleton-line is-mid" />
          <Skeleton className="skeleton-line is-short" />
          <Skeleton className="skeleton-btn" />
        </li>
      ))}
    </ul>
  );
}

export function AdminTableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="admin-table-wrap" aria-busy="true" aria-label="Loading">
      <table className="admin-table">
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, index) => (
              <th key={index}>
                <Skeleton className="skeleton-line is-short" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: cols }, (_, col) => (
                <td key={col}>
                  <Skeleton
                    className={`skeleton-line${col === 0 ? " is-title" : " is-mid"}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminStatsSkeleton() {
  return (
    <div className="admin-stats" aria-busy="true" aria-label="Loading summary">
      {Array.from({ length: 5 }, (_, index) => (
        <article key={index}>
          <Skeleton className="skeleton-line is-short" />
          <Skeleton className="skeleton-line is-stat" />
        </article>
      ))}
    </div>
  );
}
