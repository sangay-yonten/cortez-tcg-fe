import { ExternalLinkIcon } from "./Icons";

type StreamWatchLinksProps = {
  urls?: string[];
  emphasizeLive?: boolean;
  className?: string;
};

export default function StreamWatchLinks({
  urls,
  emphasizeLive = false,
  className = "",
}: StreamWatchLinksProps) {
  if (!urls?.length) return null;

  return (
    <div
      className={`stream-watch-links${emphasizeLive ? " is-live" : ""}${className ? ` ${className}` : ""}`}
      role="group"
      aria-label="Watch links"
    >
      {urls.map((url, index) => {
        const label =
          urls.length === 1 ? "Watch" : `Watch ${index + 1}`;
        return (
          <a
            key={url}
            className="stream-watch-btn"
            href={url}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
          >
            <ExternalLinkIcon />
            <span className="stream-watch-btn-label">{label}</span>
          </a>
        );
      })}
    </div>
  );
}
