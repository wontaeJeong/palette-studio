import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { StudioProvider } from "./context";
import { App } from "./App";
const host = document.getElementById("studio-root");
if (!host) throw Error("Studio root missing");
const root = createRoot(host);
flushSync(() =>
  root.render(
    <StudioProvider>
      <App />
    </StudioProvider>,
  ),
);
