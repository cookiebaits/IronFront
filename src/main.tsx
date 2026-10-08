import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Polyfill roundRect for older Android WebViews / browsers (a missing method would crash rendering).
const proto = CanvasRenderingContext2D.prototype as unknown as Record<string, unknown>;
if (typeof proto.roundRect !== "function") {
  proto.roundRect = function (this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[] = 0) {
    let rr = Array.isArray(r) ? Number(r[0]) || 0 : Number(r) || 0;
    rr = Math.max(0, Math.min(rr, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + rr, y);
    this.lineTo(x + w - rr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + rr);
    this.lineTo(x + w, y + h - rr);
    this.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    this.lineTo(x + rr, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - rr);
    this.lineTo(x, y + rr);
    this.quadraticCurveTo(x, y, x + rr, y);
    this.closePath();
  };
}

// The game is designed for landscape. On touch devices, go fullscreen and lock orientation on the first tap
// (browsers only allow orientation lock from a user gesture, usually while fullscreen).
// The Android APK additionally forces landscape in its manifest, and a portrait overlay asks the player to rotate.
if (window.matchMedia?.("(pointer: coarse)").matches) {
  window.addEventListener(
    "pointerdown",
    async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      } catch { /* fullscreen not permitted; fine */ }
      try {
        const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
        await o?.lock?.("landscape");
      } catch { /* not supported or not allowed; the rotate overlay covers this */ }
    },
    { once: true },
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
