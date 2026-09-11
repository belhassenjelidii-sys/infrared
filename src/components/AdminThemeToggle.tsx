"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  const root = document.querySelector<HTMLElement>(".admin-surface");
  if (root) root.dataset.theme = theme;
  localStorage.setItem("infrared-admin-theme", theme);
}

const THEME_EVENT = "infrared-admin-theme-change";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}
function currentTheme(): Theme {
  return localStorage.getItem("infrared-admin-theme") === "light" ? "light" : "dark";
}

export default function AdminThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribe, currentTheme, () => "dark");
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };
  return <button type="button" onClick={toggle} aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"} title={theme === "dark" ? "Thème clair" : "Thème sombre"} className="admin-theme-toggle grid h-10 w-10 place-items-center rounded-lg text-slate-300 hover:bg-slate-800">
    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
  </button>;
}
