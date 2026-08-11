import { useEffect, useState } from "react";
import {
  deleteAdminStream,
  loadAdminStreams,
  type AdminStream,
} from "../lib/adminApi";
import {
  formatStreamWhen,
  streamStatusLabel,
} from "../lib/streamSchedule";
import AdminConfirmDialog from "./AdminConfirmDialog";
import AdminStreamDetail from "./AdminStreamDetail";
import { AdminTableSkeleton } from "./Skeleton";

type AdminStreamsPanelProps = {
  onChanged: () => void;
};

export default function AdminStreamsPanel({ onChanged }: AdminStreamsPanelProps) {
  const [streams, setStreams] = useState<AdminStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminStream | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminStream | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setStreams(await loadAdminStreams());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load streams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    setError(null);
    try {
      await deleteAdminStream(pendingDelete.id);
      if (editing?.id === pendingDelete.id) setEditing(null);
      setPendingDelete(null);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete stream");
    } finally {
      setSaving(false);
    }
  }

  if (creating) {
    return (
      <AdminStreamDetail
        mode="create"
        onBack={() => setCreating(false)}
        onSaved={async () => {
          setCreating(false);
          await refresh();
          onChanged();
        }}
      />
    );
  }

  if (editing) {
    return (
      <AdminStreamDetail
        key={editing.id}
        mode="edit"
        stream={editing}
        onBack={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await refresh();
          onChanged();
        }}
      />
    );
  }

  return (
    <section className="admin-streams" aria-labelledby="streams-admin-heading">
      <div className="admin-section-head">
        <h2 id="streams-admin-heading" className="admin-section-title">
          Live stream schedule
        </h2>
        <p className="admin-muted">
          Browse the rail schedule here. Add or edit opens a dedicated form —
          same pattern as catalog.
        </p>
      </div>

      <div className="admin-toolbar">
        <button
          type="button"
          className="cart-primary-btn admin-add-btn"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          Add stream
        </button>
      </div>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <AdminTableSkeleton rows={4} cols={4} />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Stream</th>
                <th>When</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {streams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="admin-empty">
                    No streams scheduled yet.
                  </td>
                </tr>
              ) : (
                streams.map((stream) => (
                  <tr
                    key={stream.id}
                    className={stream.status === "ended" ? "is-unlisted" : ""}
                  >
                    <td>
                      <strong>{stream.title}</strong>
                      <p className="admin-muted">{stream.focus}</p>
                      {stream.streamUrls && stream.streamUrls.length > 0 && (
                        <p className="admin-muted admin-stream-url">
                          {stream.streamUrls.length === 1
                            ? "1 watch link"
                            : `${stream.streamUrls.length} watch links`}
                        </p>
                      )}
                    </td>
                    <td>{formatStreamWhen(stream)}</td>
                    <td>
                      <span className={`admin-list-pill is-${stream.status}`}>
                        {streamStatusLabel(stream.status)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-text-btn"
                          onClick={() => setEditing(stream)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-text-btn is-danger"
                          onClick={() => setPendingDelete(stream)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete && (
        <AdminConfirmDialog
          title="Delete stream?"
          message={`Remove “${pendingDelete.title}” from the public schedule?`}
          confirmLabel="Delete stream"
          danger
          busy={saving}
          onCancel={() => {
            if (!saving) setPendingDelete(null);
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </section>
  );
}
