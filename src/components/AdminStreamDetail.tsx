import { useState, type FormEvent } from "react";
import type { StreamStatus } from "../data/streams";
import {
  upsertAdminStream,
  type AdminStream,
  type AdminStreamInput,
} from "../lib/adminApi";
import { normalizeStreamUrls } from "../lib/streamLinks";
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "../lib/streamSchedule";
import AdminSelect from "./AdminSelect";

const STATUS_OPTIONS: { value: StreamStatus; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "tonight", label: "Tonight" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
];

type AdminStreamDetailProps = {
  mode: "create" | "edit";
  stream?: AdminStream;
  onBack: () => void;
  onSaved: () => void | Promise<void>;
};

export default function AdminStreamDetail({
  mode,
  stream,
  onBack,
  onSaved,
}: AdminStreamDetailProps) {
  const isCreate = mode === "create";
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(stream?.title ?? "");
  const [linkInputs, setLinkInputs] = useState<string[]>(
    stream?.streamUrls?.length ? [...stream.streamUrls] : [""],
  );
  const [startsAt, setStartsAt] = useState(
    toDatetimeLocalValue(stream?.startsAt),
  );
  const [endsAt, setEndsAt] = useState(toDatetimeLocalValue(stream?.endsAt));
  const [day, setDay] = useState(stream?.day ?? "");
  const [time, setTime] = useState(stream?.time ?? "");
  const [focus, setFocus] = useState(stream?.focus ?? "");
  const [status, setStatus] = useState<StreamStatus>(
    stream?.status ?? "upcoming",
  );
  const [sortOrder, setSortOrder] = useState(
    String(stream?.sortOrder ?? 0),
  );
  const [error, setError] = useState<string | null>(null);

  function updateLink(index: number, value: string) {
    setLinkInputs((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function addLink() {
    setLinkInputs((prev) => [...prev, ""]);
  }

  function removeLink(index: number) {
    setLinkInputs((prev) => {
      if (prev.length <= 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const nextStarts = fromDatetimeLocalValue(startsAt);
    const nextEnds = fromDatetimeLocalValue(endsAt);
    if (nextStarts && nextEnds && new Date(nextEnds) <= new Date(nextStarts)) {
      setError("End time must be after start time.");
      return;
    }

    const filled = linkInputs.map((value) => value.trim()).filter(Boolean);
    const streamUrls = normalizeStreamUrls(filled);
    if (filled.length > 0 && streamUrls.length === 0) {
      setError("Enter valid http(s) watch links.");
      return;
    }

    let nextDay = day.trim();
    let nextTime = time.trim();
    if (nextStarts) {
      const start = new Date(nextStarts);
      if (!nextDay) {
        nextDay = start.toLocaleDateString(undefined, { weekday: "short" });
      }
      if (!nextTime) {
        nextTime = start.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        });
      }
    }

    const input: AdminStreamInput = {
      id: isCreate ? undefined : stream?.id,
      title,
      day: nextDay || "TBD",
      time: nextTime || "TBD",
      focus,
      status,
      sortOrder: Number(sortOrder) || 0,
      streamUrls,
      startsAt: nextStarts,
      endsAt: nextEnds,
    };

    try {
      setSaving(true);
      await upsertAdminStream(input);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save stream");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="admin-product-detail"
      aria-labelledby="stream-detail-heading"
    >
      <button type="button" className="back-link" onClick={onBack}>
        ← Streams
      </button>
      <div className="admin-section-head">
        <p className="admin-kicker">
          {isCreate ? "New schedule slot" : "Edit schedule"}
        </p>
        <h2 id="stream-detail-heading" className="admin-title">
          {isCreate ? "Add stream" : title || stream?.title}
        </h2>
        <p className="admin-muted">
          Add one or more watch URLs. Customers see every link and can pick
          where to watch.
        </p>
      </div>

      <form
        className="admin-product-form"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="admin-form-grid">
          <label className="field admin-field-span">
            <span className="field-label">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="OP-05 Loose Pack Night"
            />
          </label>

          <div className="admin-field-span admin-link-list">
            <span className="field-label">Watch links</span>
            {linkInputs.map((value, index) => (
              <div key={index} className="admin-link-row">
                <label className="field admin-link-field">
                  <span className="sr-only">Watch link {index + 1}</span>
                  <input
                    type="url"
                    value={value}
                    onChange={(event) => updateLink(index, event.target.value)}
                    placeholder="https://youtube.com/… or twitch.tv/…"
                  />
                </label>
                {linkInputs.length > 1 && (
                  <button
                    type="button"
                    className="admin-text-btn is-danger"
                    onClick={() => removeLink(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="admin-text-btn admin-add-link-btn"
              onClick={addLink}
            >
              + Add another link
            </button>
          </div>

          <label className="field">
            <span className="field-label">Starts at</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Ends at</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Day label (fallback)</span>
            <input
              value={day}
              onChange={(event) => setDay(event.target.value)}
              placeholder="Tue"
            />
          </label>
          <label className="field">
            <span className="field-label">Time label (fallback)</span>
            <input
              value={time}
              onChange={(event) => setTime(event.target.value)}
              placeholder="7:00 PM BT"
            />
          </label>
          <label className="field">
            <span className="field-label">Sort</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </label>
          <div className="field">
            <span className="field-label">Status fallback</span>
            <AdminSelect
              value={status}
              options={STATUS_OPTIONS}
              onChange={(next) => setStatus(next as StreamStatus)}
            />
          </div>
          <label className="field admin-field-span">
            <span className="field-label">Focus / blurb</span>
            <input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              required
              placeholder="Awakening singles & slots"
            />
          </label>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-detail-actions">
          <button type="button" className="cart-secondary-btn" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="cart-primary-btn" disabled={saving}>
            {saving
              ? "Saving…"
              : isCreate
                ? "Create stream"
                : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
