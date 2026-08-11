import type { StreamEvent, StreamStatus } from "../data/streams";

const STATUS_RANK: Record<StreamStatus, number> = {
  live: 0,
  tonight: 1,
  upcoming: 2,
  ended: 3,
};

/** Derive live/tonight/upcoming/ended from the schedule window when present. */
export function resolveStreamStatus(
  stream: StreamEvent,
  now: Date = new Date(),
): StreamStatus {
  if (stream.startsAt && stream.endsAt) {
    const start = new Date(stream.startsAt).getTime();
    const end = new Date(stream.endsAt).getTime();
    const t = now.getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return stream.status;
    }
    if (t > end) return "ended";
    if (t >= start && t <= end) return "live";
    const hoursUntil = (start - t) / (1000 * 60 * 60);
    if (hoursUntil > 0 && hoursUntil <= 12) return "tonight";
    return "upcoming";
  }
  return stream.status;
}

export function withResolvedStreamStatus(
  stream: StreamEvent,
  now: Date = new Date(),
): StreamEvent {
  return { ...stream, status: resolveStreamStatus(stream, now) };
}

export function sortStreamsByPriority(
  streams: StreamEvent[],
  now: Date = new Date(),
): StreamEvent[] {
  return streams
    .map((stream) => withResolvedStreamStatus(stream, now))
    .sort((a, b) => {
      const byStatus = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (byStatus !== 0) return byStatus;

      if (a.status === "ended" && b.status === "ended") {
        const aEnd = a.endsAt ? new Date(a.endsAt).getTime() : 0;
        const bEnd = b.endsAt ? new Date(b.endsAt).getTime() : 0;
        return bEnd - aEnd;
      }

      const aStart = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
      const bStart = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
      if (aStart !== bStart) return aStart - bStart;

      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
}

export function streamStatusLabel(status: StreamStatus) {
  if (status === "live") return "Live";
  if (status === "tonight") return "Tonight";
  if (status === "ended") return "Ended";
  return "Upcoming";
}

export function formatStreamWhen(stream: StreamEvent) {
  if (stream.startsAt) {
    try {
      const start = new Date(stream.startsAt);
      const day = start.toLocaleDateString(undefined, { weekday: "short" });
      const time = start.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${day} · ${time}`;
    } catch {
      /* fall through */
    }
  }
  return `${stream.day} · ${stream.time}`;
}

/** datetime-local value from ISO / timestamptz string */
export function toDatetimeLocalValue(iso: string | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}
