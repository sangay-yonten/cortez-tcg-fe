import { useEffect, useState, type FormEvent } from "react";
import {
  loadAdminHomeHighlight,
  saveAdminHomeHighlight,
} from "../lib/adminApi";
import {
  DEFAULT_HOME_HIGHLIGHT,
  type HomeHighlight,
  type HomeHighlightAction,
} from "../lib/homeHighlight";
import AdminSelect from "./AdminSelect";

type AdminHomePanelProps = {
  onChanged: () => void;
};

const ACTION_OPTIONS: { value: HomeHighlightAction; label: string }[] = [
  { value: "schedule", label: "Open schedule" },
  { value: "shop", label: "Open shop" },
  { value: "url", label: "External URL" },
];

export default function AdminHomePanel({ onChanged }: AdminHomePanelProps) {
  const [form, setForm] = useState<HomeHighlight>({ ...DEFAULT_HOME_HIGHLIGHT });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const highlight = await loadAdminHomeHighlight();
        if (!cancelled) setForm(highlight);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load home highlight",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function patch(partial: Partial<HomeHighlight>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setSavedNote(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSavedNote(null);
    try {
      const saved = await saveAdminHomeHighlight(form);
      setForm(saved);
      setSavedNote("Saved. Storefront will pick this up on refresh.");
      onChanged();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save home highlight",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="admin-muted">Loading home highlight…</p>;
  }

  return (
    <section className="admin-inventory" aria-labelledby="admin-home-heading">
      <div className="admin-section-head">
        <h2 id="admin-home-heading" className="admin-section-title">
          Home highlight
        </h2>
        <p className="admin-muted">
          The “Going viral” card under the bio. Turn it off or clear the title
          and body to hide it.
        </p>
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {savedNote && (
        <p className="admin-success" role="status">
          {savedNote}
        </p>
      )}

      <form className="admin-form-grid" onSubmit={handleSubmit}>
        <label className="admin-toggle-row admin-field-span">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => patch({ enabled: event.target.checked })}
          />
          Show on homepage
        </label>

        <label className="field">
          <span className="field-label">Kicker</span>
          <input
            type="text"
            value={form.kicker}
            onChange={(event) => patch({ kicker: event.target.value })}
            placeholder="Going viral"
          />
        </label>

        <label className="field admin-field-span">
          <span className="field-label">Title</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => patch({ title: event.target.value })}
            required={form.enabled}
          />
        </label>

        <label className="field admin-field-span">
          <span className="field-label">Body</span>
          <textarea
            rows={3}
            value={form.body}
            onChange={(event) => patch({ body: event.target.value })}
          />
        </label>

        <fieldset className="admin-fieldset admin-field-span">
          <legend>Primary button</legend>
          <div className="admin-form-grid">
            <label className="field">
              <span className="field-label">Label</span>
              <input
                type="text"
                value={form.primaryLabel}
                onChange={(event) =>
                  patch({ primaryLabel: event.target.value })
                }
              />
            </label>
            <div className="field">
              <AdminSelect
                label="Action"
                value={form.primaryAction}
                options={ACTION_OPTIONS}
                onChange={(next) =>
                  patch({ primaryAction: next as HomeHighlightAction })
                }
              />
            </div>
            {form.primaryAction === "url" && (
              <label className="field admin-field-span">
                <span className="field-label">URL</span>
                <input
                  type="url"
                  value={form.primaryUrl ?? ""}
                  onChange={(event) =>
                    patch({ primaryUrl: event.target.value })
                  }
                  placeholder="https://"
                  required
                />
              </label>
            )}
          </div>
        </fieldset>

        <fieldset className="admin-fieldset admin-field-span">
          <legend>Secondary button</legend>
          <div className="admin-form-grid">
            <label className="field">
              <span className="field-label">Label</span>
              <input
                type="text"
                value={form.secondaryLabel}
                onChange={(event) =>
                  patch({ secondaryLabel: event.target.value })
                }
              />
            </label>
            <div className="field">
              <AdminSelect
                label="Action"
                value={form.secondaryAction}
                options={ACTION_OPTIONS}
                onChange={(next) =>
                  patch({ secondaryAction: next as HomeHighlightAction })
                }
              />
            </div>
            {form.secondaryAction === "url" && (
              <label className="field admin-field-span">
                <span className="field-label">URL</span>
                <input
                  type="url"
                  value={form.secondaryUrl ?? ""}
                  onChange={(event) =>
                    patch({ secondaryUrl: event.target.value })
                  }
                  placeholder="https://"
                  required
                />
              </label>
            )}
          </div>
        </fieldset>

        <div className="admin-detail-actions admin-field-span">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save highlight"}
          </button>
        </div>
      </form>
    </section>
  );
}
