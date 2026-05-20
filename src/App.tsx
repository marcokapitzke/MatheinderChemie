import { useEffect, useState } from "react";
import { Header } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { DerivativeCalculator } from "./components/DerivativeCalculator";
import { IntegralCalculator } from "./components/IntegralCalculator";
import { FunctionPlotter } from "./components/FunctionPlotter";
import { ComplexCalculator } from "./components/ComplexCalculator";
import { LimitsSequencesSeries } from "./components/LimitsSequencesSeries";
import type { RouteId } from "./data/modules";

const routeIds: RouteId[] = ["home", "derivatives", "integrals", "plotter", "complex", "limits"];

function routeFromHash(): RouteId {
  const hash = window.location.hash.replace("#", "") as RouteId;
  return routeIds.includes(hash) ? hash : "home";
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(routeFromHash);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const onHashChange = () => {
      setRoute(routeFromHash());
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (next: RouteId) => {
    window.location.hash = next === "home" ? "" : next;
    setRoute(next);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  return (
    <>
      <Header route={route} onNavigate={navigate} />
      {route === "home" ? <HomePage onNavigate={navigate} /> : null}
      {route === "derivatives" ? <DerivativeCalculator onNavigate={navigate} /> : null}
      {route === "integrals" ? <IntegralCalculator onNavigate={navigate} /> : null}
      {route === "plotter" ? <FunctionPlotter onNavigate={navigate} /> : null}
      {route === "complex" ? <ComplexCalculator onNavigate={navigate} /> : null}
      {route === "limits" ? <LimitsSequencesSeries onNavigate={navigate} /> : null}
      <footer className="site-footer">
        <div className="section-shell footer-inner">
          <span>Mathematik für Biochemie</span>
          <a href="https://marcokapitzke.github.io" target="_blank" rel="noreferrer">
            marcokapitzke.github.io
          </a>
        </div>
      </footer>
    </>
  );
}
