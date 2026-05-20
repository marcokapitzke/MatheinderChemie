import React from "react";
import ReactDOM from "react-dom/client";
import "katex/dist/katex.min.css";
import "./styles.css";
import App from "./App";
import { NotationProvider } from "./lib/notationContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotationProvider>
      <App />
    </NotationProvider>
  </React.StrictMode>
);
