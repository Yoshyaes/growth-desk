"use client";

export function ThemeToggle() {
  return (
    <button
      className="btn"
      type="button"
      onClick={() => {
        const root = document.documentElement;
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try { localStorage.setItem("gd-theme", next); } catch {}
      }}
    >
      Theme
    </button>
  );
}
