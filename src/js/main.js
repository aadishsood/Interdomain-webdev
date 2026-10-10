import React from "react";
import ReactDOM from "react-dom/client";
import { MoltenMetal } from "react-bits/backgrounds";

/**
 * Theme-aware Molten Metal Background
 * -----------------------------------
 * - Renders a fixed full-screen canvas behind all page content.
 * - Automatically adapts its colours when the user toggles the site theme.
 * - Listens to the existing #themeToggle button (if present) and also
 *   reacts to changes of a `data-theme` attribute on <html>.
 */

// 1️⃣  Colour palettes for each theme
const THEME_PALETTES = {
  dark: {
    color1: "#0a1f2f",   // deep navy
    color2: "#1e70bf",   // electric blue
    color3: "#06b6d4",   // bright cyan
    colorMode: "frost",
  },
  light: {
    // Sophisticated cool-toned palette for light backgrounds
    // Deeper, muted tones that provide contrast without harshness
    color1: "#eef3f6",   // subtle slate-tinted off-white (barely-there base)
    color2: "#2d5a7f",   // muted deep blue-teal (strong contrast, easy on eyes)
    color3: "#1d8aa3",   // refined cyan-teal (vibrant but not harsh)
    colorMode: "frost",
  },
};

// 2️⃣  Helper to read current theme from the DOM
function getCurrentTheme() {
  // Check for a `data-theme` attribute on <html> or <body>
  const htmlTheme = document.documentElement.getAttribute("data-theme");
  const bodyTheme = document.body.getAttribute("data-theme");
  if (htmlTheme) return htmlTheme;
  if (bodyTheme) return bodyTheme;

  // Fallback: check for a class like "dark" or "light"
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  if (document.body.classList.contains("dark")) return "dark";
  if (document.body.classList.contains("light")) return "light";

  // Final fallback: prefer-color-scheme
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// 3️⃣  Create a fixed container for the background (if it doesn't exist)
function ensureBackgroundContainer() {
  let container = document.getElementById("molten-metal-bg");
  if (!container) {
    container = document.createElement("div");
    container.id = "molten-metal-bg";
    Object.assign(container.style, {
      position: "fixed",
      inset: "0",
      zIndex: "-1",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none", // let clicks pass through
    });
    document.body.prepend(container);
  }
  return container;
}

// 4️⃣  React component that receives the current palette
function MoltenBackground({ palette }) {
  return (
    <MoltenMetal
      color1={palette.color1}
      color2={palette.color2}
      color3={palette.color3}
      colorMode={palette.colorMode}
    />
  );
}

// 5️⃣  Main mount logic
function mount() {
  const bgContainer = ensureBackgroundContainer();

  // Create a React root for the background only
  const root = ReactDOM.createRoot(bgContainer);

  // Initial render
  let currentTheme = getCurrentTheme();
  let currentPalette = THEME_PALETTES[currentTheme];
  root.render(<MoltenBackground palette={currentPalette} />);

  // 6️⃣  Theme change detection
  //    a) Listen to the existing theme-toggle button (if any)
  const toggleBtn = document.getElementById("themeToggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      // Give the existing theme logic a tick to update the DOM
      setTimeout(() => {
        currentTheme = getCurrentTheme();
        currentPalette = THEME_PALETTES[currentTheme];
        root.render(<MoltenBackground palette={currentPalette} />);
      }, 0);
    });
  }

  //    b) Observe attribute changes on <html> and <body> (covers class/data-theme changes)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName === "data-theme" || mutation.attributeName === "class")
      ) {
        const newTheme = getCurrentTheme();
        if (newTheme !== currentTheme) {
          currentTheme = newTheme;
          currentPalette = THEME_PALETTES[currentTheme];
          root.render(<MoltenBackground palette={currentPalette} />);
        }
        break;
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme", "class"] });

  //    c) Also listen to system preference changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    // Only auto-switch if the site doesn't have an explicit theme set
    if (!document.documentElement.hasAttribute("data-theme") && !document.body.hasAttribute("data-theme")) {
      currentTheme = getCurrentTheme();
      currentPalette = THEME_PALETTES[currentTheme];
      root.render(<MoltenBackground palette={currentPalette} />);
    }
  });

  // Cleanup on unload (not strictly needed for SPA)
  window.addEventListener("beforeunload", () => {
    observer.disconnect();
    mediaQuery.removeEventListener("change", () => {});
  });
}

// 7️⃣  Run when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}