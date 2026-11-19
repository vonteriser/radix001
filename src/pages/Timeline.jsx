import LiquidGlassSurface from "../components/LiquidGlassSurface";
import GlassWord from "../components/GlassWord";

// The live /timeline route intentionally prints only "TBH [TO BE DISCUSSED]".
// The draft schedule is archived in src/data/radixData.js (ARCHIVED_MASTER_TIMELINE).
export default function Timeline() {
  return (
    <main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pb-28 pt-28"
      style={{ color: "var(--fg)" }}
    >
      <p
        className="mb-6 text-center text-[10px] tracking-[0.36em] sm:text-xs"
        style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}
      >
        RADIX // 01 — MASTER TIMELINE
      </p>

      <div className="gt-float" style={{ width: "min(94vw, 1100px)" }}>
        <LiquidGlassSurface
          radius={56}
          blur={24}
          bezel={64}
          refraction={1.15}
          tilt={5}
          className="w-full"
          style={{ background: "var(--glass-bg)" }}
        >
          <div className="px-4 py-12 text-center sm:px-14 sm:py-20" style={{ perspective: 1000 }}>
            <h1 className="m-0 font-normal">
              <GlassWord style={{ fontSize: "clamp(5rem, 16vw, 13rem)" }}>TBH</GlassWord>{" "}
              <GlassWord
                mono
                style={{
                  display: "block",
                  marginTop: "clamp(0.6rem, 2vw, 1.6rem)",
                  fontSize: "clamp(1.05rem, 3.4vw, 2.6rem)",
                  fontWeight: 600,
                  lineHeight: 1.1,
                }}
              >
                [TO BE DISCUSSED]
              </GlassWord>
            </h1>
          </div>
        </LiquidGlassSurface>
      </div>

      <p
        className="mt-8 max-w-md text-center text-[10px] leading-relaxed tracking-[0.26em] sm:text-[11px]"
        style={{ fontFamily: "var(--font-mono)", color: "var(--fg-faint)" }}
      >
        EVENT-DAY SCHEDULE UNDER REVIEW · ARCHIVED DRAFT ON STANDBY
      </p>
    </main>
  );
}
