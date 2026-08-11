import { useShop } from "../lib/ShopContext";
import {
  formatStreamWhen,
  sortStreamsByPriority,
  streamStatusLabel,
} from "../lib/streamSchedule";
import { Skeleton } from "./Skeleton";
import StreamWatchLinks from "./StreamWatchLinks";

type SchedulePageProps = {
  onBackHome: () => void;
};

function ScheduleSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ol
      className="schedule-timeline"
      aria-busy="true"
      aria-label="Loading schedule"
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="schedule-row">
          <span className="schedule-dot" aria-hidden="true" />
          <div className="schedule-row-card">
            <div className="schedule-row-top">
              <Skeleton className="skeleton-pill" />
              <Skeleton className="skeleton-line is-short" />
            </div>
            <Skeleton className="skeleton-line is-title" />
            <Skeleton className="skeleton-line" />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function SchedulePage({ onBackHome }: SchedulePageProps) {
  const { streams, ready } = useShop();
  const ordered = sortStreamsByPriority(streams);
  const active = ordered.filter((stream) => stream.status !== "ended");
  const ended = ordered.filter((stream) => stream.status === "ended");

  return (
    <section className="schedule-page" aria-labelledby="schedule-heading">
      <div className="packs-page-header">
        <button type="button" className="back-link" onClick={onBackHome}>
          ← Home
        </button>
        <h1 id="schedule-heading" className="packs-page-title">
          Stream schedule
        </h1>
        <p className="packs-page-meta">
          Live & upcoming first, then ended sessions — ordered by time.
        </p>
      </div>

      {!ready ? (
        <ScheduleSkeleton />
      ) : (
        <>
          <section
            className="schedule-group"
            aria-labelledby="schedule-active-heading"
          >
            <h2 id="schedule-active-heading" className="schedule-group-title">
              Live & Upcoming
            </h2>
            {active.length === 0 ? (
              <p className="admin-muted">No live or upcoming streams yet.</p>
            ) : (
              <ol className="schedule-timeline">
                {active.map((stream, index) => (
                  <li
                    key={stream.id}
                    className={`schedule-row is-${stream.status}`}
                    style={{ ["--schedule-index" as string]: String(index) }}
                  >
                    <span className="schedule-dot" aria-hidden="true" />
                    <div className="schedule-row-card">
                      <div className="schedule-row-top">
                        <span className={`stream-status is-${stream.status}`}>
                          {streamStatusLabel(stream.status)}
                        </span>
                        <span className="stream-when">
                          {formatStreamWhen(stream)}
                        </span>
                      </div>
                      <h3 className="schedule-row-title">{stream.title}</h3>
                      <p className="schedule-row-focus">{stream.focus}</p>
                      <StreamWatchLinks
                        urls={stream.streamUrls}
                        emphasizeLive={stream.status === "live"}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section
            className="schedule-group"
            aria-labelledby="schedule-ended-heading"
          >
            <h2 id="schedule-ended-heading" className="schedule-group-title">
              Ended
            </h2>
            {ended.length === 0 ? (
              <p className="admin-muted">No ended streams in the schedule.</p>
            ) : (
              <ol className="schedule-timeline is-ended">
                {ended.map((stream, index) => (
                  <li
                    key={stream.id}
                    className="schedule-row is-ended"
                    style={{ ["--schedule-index" as string]: String(index) }}
                  >
                    <span className="schedule-dot" aria-hidden="true" />
                    <div className="schedule-row-card">
                      <div className="schedule-row-top">
                        <span className="stream-status is-ended">Ended</span>
                        <span className="stream-when">
                          {formatStreamWhen(stream)}
                        </span>
                      </div>
                      <h3 className="schedule-row-title">{stream.title}</h3>
                      <p className="schedule-row-focus">{stream.focus}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </section>
  );
}
