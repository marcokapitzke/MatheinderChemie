import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import type { RouteId } from "../data/modules";
import { modules } from "../data/modules";

interface LayoutProps {
  route: RouteId;
  onNavigate: (route: RouteId) => void;
}

const visitorCounterUrl = "https://api.counterapi.dev/v1/matheinderchemie/besucher/up";
const visitorSessionKey = "mathchem-visitor-number";

export function Header({ route, onNavigate }: LayoutProps) {
  return (
    <header className="site-header">
      <nav className="nav section-shell" aria-label="Hauptnavigation">
        <button className="brand" type="button" onClick={() => onNavigate("home")} aria-label="Startseite">
          <FlaskConical size={19} />
          <span>MathChem</span>
        </button>
        <div className="nav-links">
          {modules.map((module) => (
            <button
              key={module.id}
              className={route === module.id ? "is-active" : ""}
              type="button"
              onClick={() => onNavigate(module.id)}
            >
              {module.title}
            </button>
          ))}
        </div>
        <VisitorCounter />
      </nav>
    </header>
  );
}

function VisitorCounter() {
  const [count, setCount] = useState<number | null>(() => readCachedVisitorNumber());
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (count) return;

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    fetch(visitorCounterUrl, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Counter unavailable");
        return response.json();
      })
      .then((payload: unknown) => {
        const nextCount = extractCounterNumber(payload);
        if (!nextCount || cancelled) return;
        window.sessionStorage.setItem(visitorSessionKey, String(nextCount));
        setCount(nextCount);
      })
      .catch(() => {
        if (!cancelled) setIsHidden(true);
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [count]);

  if (isHidden) return <span className="visitor-counter visitor-counter--ghost" aria-hidden="true" />;

  return (
    <span className="visitor-counter" aria-live="polite" aria-label={count ? `Sie sind Besucher Nummer ${count}` : "Besucherzahl wird geladen"}>
      <span>Sie sind Besucher Nr.</span>
      <strong>{count ? formatVisitorCount(count) : "..."}</strong>
    </span>
  );
}

function readCachedVisitorNumber() {
  const cached = window.sessionStorage.getItem(visitorSessionKey);
  if (!cached) return null;
  const parsed = Number(cached);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatVisitorCount(value: number) {
  return new Intl.NumberFormat("de-DE").format(Math.round(value));
}

function extractCounterNumber(value: unknown, depth = 0): number | null {
  if (depth > 3) return null;

  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const preferredEntries = Object.entries(record).filter(([key]) => /count|value|data|total|visit|result/i.test(key));
  for (const [, item] of preferredEntries) {
    const extracted = extractCounterNumber(item, depth + 1);
    if (extracted) return extracted;
  }

  return null;
}
