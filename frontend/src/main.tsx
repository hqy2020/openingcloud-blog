import React from "react";
import ReactDOM from "react-dom/client";
import { AppProviders } from "./app/providers";
import "./styles/index.css";
import { registerServiceWorker } from "./lib/registerSW";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>,
);

registerServiceWorker();
