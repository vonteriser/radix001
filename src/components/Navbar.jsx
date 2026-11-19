import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import LiquidGlassSurface from "./LiquidGlassSurface";
import { SECTIONS } from "../data/radixData";

// Auto-hiding glass navbar: hidden on "/", spring-slides down everywhere else.
export default function Navbar() {
  const { pathname } = useLocation();
  const hidden = pathname === "/";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      inert={hidden}
      aria-hidden={hidden}
      className="fixed inset-x-0 top-0 z-[60] flex justify-center px-3 pt-3"
      style={{
        transform: hidden ? "translateY(-120%)" : "translateY(0)",
        opacity: hidden ? 0 : 1,
        pointerEvents: "none",
        transition: "transform 0.95s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease",
        willChange: "transform, opacity",
      }}
    >
      <div className="w-full max-w-5xl" style={{ pointerEvents: hidden ? "none" : "auto" }}>
        <LiquidGlassSurface radius={26} blur={18} refraction={0.7} dispersion={false} bezel={16} className="w-full">
          <nav className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5" style={{ color: "var(--fg)" }}>
            <Link
              to="/"
              className="group flex items-center gap-2 text-[13px] font-bold tracking-[0.18em] outline-none sm:text-sm"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: "#72efdd", boxShadow: "0 0 12px #72efdd", animation: "pulse-dot 2.4s infinite" }}
              />
              RADIX <span style={{ color: "var(--fg-dim)" }}>// 01</span>
            </Link>

            <ul className="hidden items-center gap-1 md:flex">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <NavLink
                    to={s.path}
                    className="relative block rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-[0.2em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    style={({ isActive }) => ({
                      fontFamily: "var(--font-mono)",
                      color: isActive ? "var(--fg)" : "var(--fg-dim)",
                      background: isActive ? "var(--glass-bg-strong)" : "transparent",
                      boxShadow: isActive ? "inset 0 1px 0 var(--glass-spec)" : "none",
                    })}
                  >
                    {s.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-[11px] tracking-[0.2em] md:hidden"
              style={{ fontFamily: "var(--font-mono)", background: "var(--glass-bg-strong)" }}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "CLOSE" : "MENU"}
            </button>
          </nav>

          <div
            className="md:hidden"
            style={{
              maxHeight: open ? 340 : 0,
              overflow: "hidden",
              transition: "max-height 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <ul className="flex flex-col gap-1 px-3 pb-3">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <NavLink
                    to={s.path}
                    className="block rounded-2xl px-4 py-3 text-xs tracking-[0.24em]"
                    style={({ isActive }) => ({
                      fontFamily: "var(--font-mono)",
                      color: "var(--fg)",
                      background: isActive ? "var(--glass-bg-strong)" : "transparent",
                    })}
                  >
                    {s.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </LiquidGlassSurface>
      </div>
    </header>
  );
}
