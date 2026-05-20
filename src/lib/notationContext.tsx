import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ExponentialNotation } from "./mathCore";

interface NotationContextValue {
  exponential: ExponentialNotation;
  setExponential: (notation: ExponentialNotation) => void;
}

const NotationContext = createContext<NotationContextValue | null>(null);

export function NotationProvider({ children }: { children: ReactNode }) {
  const [exponential, setExponential] = useState<ExponentialNotation>("exp");

  const value = useMemo(() => ({ exponential, setExponential }), [exponential]);
  return <NotationContext.Provider value={value}>{children}</NotationContext.Provider>;
}

export function useNotation() {
  const context = useContext(NotationContext);
  if (!context) throw new Error("useNotation must be used inside NotationProvider");
  return context;
}
