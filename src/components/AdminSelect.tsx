import { useEffect, useId, useRef, useState } from "react";

export type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  label?: string;
  value: string;
  options: AdminSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export default function AdminSelect({
  label,
  value,
  options,
  disabled = false,
  onChange,
  className = "",
}: AdminSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className={`admin-select ${className}`.trim()}
      ref={rootRef}
      data-open={open ? "true" : "false"}
    >
      {label ? <span className="admin-select-label">{label}</span> : null}
      <button
        type="button"
        className="admin-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? "Select"}</span>
        <span className="admin-select-caret" aria-hidden="true" />
      </button>
      {open && (
        <ul
          id={listId}
          className="admin-select-menu"
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`admin-select-option${isActive ? " is-active" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
