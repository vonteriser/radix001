import { useTheme } from "../context/ThemeContext";
import LiquidGlassSurface from "./LiquidGlassSurface";

function Sun() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="12" y1="2.5" x2="12" y2="5" transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

// Persistent bottom-right Liquid Glass Dark/Light switch. Shift+click returns to OS auto mode.
export default function ThemeToggle() {
  const { theme, toggle, isManual, resetAuto } = useTheme();
  const dark = theme === "dark";

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {!isManual && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.25em]"
          style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}
        >
          AUTO
        </span>
      )}
      <LiquidGlassSurface
        as="button"
        type="button"
        radius={999}
        blur={14}
        refraction={0.6}
        dispersion={false}
        bezel={14}
        onClick={(e) => (e.shiftKey ? resetAuto() : toggle())}
        aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
        title={`${dark ? "Dark" : "Light"} mode${isManual ? " (manual)" : " (auto)"} — click to switch, shift+click for auto`}
        className="cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        style={{ width: 92, height: 46, display: "block", color: "var(--fg)", padding: 0 }}
      >
        <span className="relative flex h-full w-full items-center justify-between px-3.5">
          <span style={{ opacity: dark ? 0.45 : 1, transition: "opacity .4s" }}>
            <Sun />
          </span>
          <span style={{ opacity: dark ? 1 : 0.45, transition: "opacity .4s" }}>
            <Moon />
          </span>
          {/* sliding liquid knob */}
          <span
            aria-hidden="true"
            className="absolute top-1 left-1 h-[38px] w-[38px] rounded-full"
            style={{
              transform: `translateX(${dark ? 46 : 0}px)`,
              transition: "transform .7s cubic-bezier(0.22, 1, 0.36, 1)",
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,.95), rgba(255,255,255,.35) 55%, rgba(255,255,255,.15))",
              boxShadow: "0 4px 14px rgba(0,0,0,.28), inset 0 1px 1px rgba(255,255,255,.9)",
              mixBlendMode: "normal",
            }}
          />
        </span>
      </LiquidGlassSurface>
    </div>
  );
}
