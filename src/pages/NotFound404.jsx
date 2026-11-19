import LiquidGlassSurface from "../components/LiquidGlassSurface";
import GlassWord from "../components/GlassWord";
import { useTransitionCtx } from "../context/TransitionContext";

const SHAPES = [
  { w: 420, h: 420, left: "8%", top: "12%", bg: "radial-gradient(circle at 30% 30%, #ff5c7a, #7b2cff)", r: "50%", d: "0s" },
  { w: 260, h: 260, left: "70%", top: "58%", bg: "linear-gradient(135deg, #ffb347, #ff3b5c)", r: "38px", d: "-4s" },
  { w: 520, h: 26, left: "20%", top: "72%", bg: "linear-gradient(90deg, #00e1ff, #7a5cff)", r: "999px", d: "-2s" },
  { w: 30, h: 360, left: "82%", top: "8%", bg: "linear-gradient(180deg, #fff, #ff8a3c)", r: "999px", d: "-6s" },
  { w: 180, h: 180, left: "52%", top: "6%", bg: "conic-gradient(from 0deg, #72efdd, #7a5cff, #ff5c9a, #72efdd)", r: "50%", d: "-1s" },
];

export default function NotFound404() {
  const { burstTo } = useTransitionCtx();

  return (
    <main className="fixed inset-0 z-20 flex items-center justify-center overflow-hidden px-4 pb-16 pt-24" style={{ color: "var(--fg)" }}>
      {/* hard-edged forms trapped behind the glass so the frost reads as physical */}
      <div aria-hidden="true" className="absolute inset-0">
        {SHAPES.map((s, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              width: s.w,
              height: s.h,
              left: s.left,
              top: s.top,
              background: s.bg,
              borderRadius: s.r,
              opacity: 0.95,
              animation: `drift-slow ${16 + i * 3}s ease-in-out infinite`,
              animationDelay: s.d,
            }}
          />
        ))}
      </div>

      {/* thick ice-frosted security glass */}
      <LiquidGlassSurface
        radius={40}
        blur={40}
        tilt={2}
        ripple
        className="grain absolute inset-3 sm:inset-6"
        style={{
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 14px)" }} />
        <div className="relative flex h-full w-full flex-col items-center justify-center px-4 text-center">
          <p className="mb-5 text-[10px] tracking-[0.36em] sm:text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}>
            ERROR — ACCESS DENIED
          </p>
          <h1 className="m-0 font-normal" style={{ lineHeight: 0.95 }}>
            <GlassWord style={{ fontSize: "clamp(5rem, 19vw, 14rem)" }}>404</GlassWord>{" "}
            <GlassWord
              mono
              style={{
                display: "block",
                marginTop: "clamp(0.5rem, 1.6vw, 1.4rem)",
                fontSize: "clamp(1.05rem, 3.6vw, 2.8rem)",
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              // SECTOR INACCESSIBLE
            </GlassWord>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-relaxed sm:text-base" style={{ color: "var(--fg)", textShadow: "0 1px 14px rgba(0,0,0,0.25)" }}>
            The logic path you requested failed to compile or does not exist in RADIX // 01.
          </p>

          <LiquidGlassSurface
            as="button"
            type="button"
            radius={999}
            blur={16}
            bezel={22}
            refraction={0.9}
            ripple
            onClick={(e) => burstTo(e.clientX, e.clientY, "#72efdd", "/")}
            className="mt-9 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ color: "var(--fg)", padding: 0, display: "block", background: "var(--glass-bg-strong)" }}
          >
            <span className="block px-8 py-4 text-xs font-semibold tracking-[0.3em] sm:text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              RETURN TO CORE [ / ]
            </span>
          </LiquidGlassSurface>
        </div>
      </LiquidGlassSurface>
    </main>
  );
}
