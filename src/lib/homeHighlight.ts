export type HomeHighlightAction = "schedule" | "shop" | "url";

export type HomeHighlight = {
  enabled: boolean;
  kicker: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryAction: HomeHighlightAction;
  primaryUrl?: string | null;
  secondaryLabel: string;
  secondaryAction: HomeHighlightAction;
  secondaryUrl?: string | null;
};

export const DEFAULT_HOME_HIGHLIGHT: HomeHighlight = {
  enabled: true,
  kicker: "Going viral",
  title: "Last night's OP-05 chase hit 40K views",
  body: "Manga rare pulled live on stream — catch the replay, then lock a slot for tonight's opening.",
  primaryLabel: "Watch schedule",
  primaryAction: "schedule",
  primaryUrl: null,
  secondaryLabel: "Shop catalog",
  secondaryAction: "shop",
  secondaryUrl: null,
};

function asAction(value: unknown, fallback: HomeHighlightAction): HomeHighlightAction {
  if (value === "schedule" || value === "shop" || value === "url") return value;
  return fallback;
}

export function parseHomeHighlight(value: unknown): HomeHighlight {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_HOME_HIGHLIGHT };
  }
  const raw = value as Record<string, unknown>;
  return {
    enabled: raw.enabled !== false,
    kicker: String(raw.kicker ?? DEFAULT_HOME_HIGHLIGHT.kicker),
    title: String(raw.title ?? DEFAULT_HOME_HIGHLIGHT.title),
    body: String(raw.body ?? DEFAULT_HOME_HIGHLIGHT.body),
    primaryLabel: String(
      raw.primaryLabel ?? DEFAULT_HOME_HIGHLIGHT.primaryLabel,
    ),
    primaryAction: asAction(
      raw.primaryAction,
      DEFAULT_HOME_HIGHLIGHT.primaryAction,
    ),
    primaryUrl:
      raw.primaryUrl == null || String(raw.primaryUrl).trim() === ""
        ? null
        : String(raw.primaryUrl).trim(),
    secondaryLabel: String(
      raw.secondaryLabel ?? DEFAULT_HOME_HIGHLIGHT.secondaryLabel,
    ),
    secondaryAction: asAction(
      raw.secondaryAction,
      DEFAULT_HOME_HIGHLIGHT.secondaryAction,
    ),
    secondaryUrl:
      raw.secondaryUrl == null || String(raw.secondaryUrl).trim() === ""
        ? null
        : String(raw.secondaryUrl).trim(),
  };
}

export function homeHighlightIsVisible(highlight: HomeHighlight | null | undefined) {
  if (!highlight?.enabled) return false;
  return Boolean(highlight.title.trim() || highlight.body.trim());
}
