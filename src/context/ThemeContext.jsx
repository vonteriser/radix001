import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "radix-theme-override";

const QUERY = "(prefers-color-scheme: dark)";

function readSystem() {
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function readManual() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }) {
  const [system, setSystem] = useState(readSystem);
  const [manual, setManual] = useState(readManual);

  // Real-time OS theme changes (only matter while there is no manual override).
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setSystem(e.matches ? "dark" : "light");
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  const theme = manual ?? system;

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#05070b" : "#eef1f7");
  }, [theme]);

  const setTheme = useCallback((next) => {
    setManual(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const resetAuto = useCallback(() => {
    setManual(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo(
    () => ({ theme, isManual: manual !== null, setTheme, toggle, resetAuto }),
    [theme, manual, setTheme, toggle, resetAuto]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
