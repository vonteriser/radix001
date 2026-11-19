import LiquidGlassSurface from "../components/LiquidGlassSurface";
import GlassWord from "../components/GlassWord";

// /register mirrors the /timeline approach: a glass monolith that literally prints "TBH [TO BE DISCUSSED]".
export default function Register() {
  const big = "clamp(3.5rem, 11vw, 9rem)";
  // keep the longest word inside the monolith on narrow viewports
  const fit = "min(clamp(3.5rem, 11vw, 9rem), 13vw)";
  return (
    <main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-3 pb-28 pt-28"
      style={{ color: "var(--fg)" }}
    >
      <p
        className="mb-6 text-center text-[10px] tracking-[0.36em] sm:text-xs"
        style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}
      >
        RADIX // 01 — REGISTRATION PORTAL
      </p>

      <div className="gt-float" style={{ width: "min(96vw, 1100px)" }}>
        <LiquidGlassSurface
          radius={48}
          blur={26}
          bezel={72}
          refraction={1.2}
          tilt={6}
          ripple
          className="w-full"
          style={{ background: "var(--glass-bg)" }}
        >
          <div className="relative px-2 py-12 text-center sm:px-14 sm:py-16">
            {/* monolith corner marks */}
            {["left-4 top-4", "right-4 top-4", "left-4 bottom-4", "right-4 bottom-4"].map((pos) => (
              <span
                key={pos}
                aria-hidden="true"
                className={`absolute h-3 w-3 ${pos}`}
                style={{
                  borderTop: pos.includes("top") ? "1.5px solid var(--glass-rim)" : "none",
                  borderBottom: pos.includes("bottom") ? "1.5px solid var(--glass-rim)" : "none",
                  borderLeft: pos.includes("left") ? "1.5px solid var(--glass-rim)" : "none",
                  borderRight: pos.includes("right") ? "1.5px solid var(--glass-rim)" : "none",
                }}
              />
            ))}
            <h1 className="m-0 font-normal" style={{ lineHeight: 0.92 }}>
              <GlassWord style={{ fontSize: big }}>TBH</GlassWord>{" "}
              <GlassWord style={{ display: "block", fontSize: fit, marginTop: "0.04em" }}>[TO BE</GlassWord>{" "}
              <GlassWord style={{ display: "block", fontSize: fit, marginTop: "0.04em" }}>DISCUSSED]</GlassWord>
            </h1>
          </div>
        </LiquidGlassSurface>
      </div>

      <p
        className="mt-8 text-center text-[10px] tracking-[0.26em] sm:text-[11px]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--fg-faint)" }}
      >
        PILOT EDITION · SEATING PROTOCOL PENDING
      </p>
    </main>
  );
}
