import RadialWheel from "../components/RadialWheel";
import { useTransitionCtx } from "../context/TransitionContext";
import { EVENT } from "../data/radixData";

export default function Home() {
  const { revealed, burstTo } = useTransitionCtx();

  return (
    <main
      className="relative z-10 flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ height: "100dvh", color: "var(--fg)" }}
    >
      <header
        className="mb-5 text-center sm:mb-7"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(14px)",
          transition: "opacity 1s ease .3s, transform 1s var(--ease-spring) .3s",
        }}
      >
        <p
          className="mb-2 text-[10px] tracking-[0.34em] sm:text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}
        >
          {EVENT.subtitle.toUpperCase()}
        </p>
        <h1 className="text-[1.7rem] font-bold leading-none tracking-tight sm:text-5xl">
          RADIX <span style={{ color: "var(--fg-dim)" }}>// 01</span>{" "}
          <span className="text-[0.45em] font-medium tracking-[0.12em]" style={{ color: "var(--fg-dim)" }}>
            (PILOT EDITION)
          </span>
        </h1>
      </header>

      <RadialWheel revealed={revealed} onSelect={(s, x, y) => burstTo(x, y, s.accent, s.path)} />

      <p
        className="mt-5 text-center text-[10px] tracking-[0.26em] sm:mt-7 sm:text-[11px]"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--fg-faint)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 1s ease .8s",
        }}
      >
        HOVER · DRAG · ← → · SCROLL · ENTER
      </p>
    </main>
  );
}
