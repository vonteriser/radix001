import { useCallback, useEffect, useRef, useState } from "react";
import LiquidGlassSurface from "../components/LiquidGlassSurface";
import { useTheme } from "../context/ThemeContext";
import { EVENTS, PHASES } from "../data/radixData";

// Apple-style animated mesh gradient living behind each slide's glass layer.
function Mesh({ colors }) {
  const [base, c1, c2, c3] = colors;
  return (
    <div className="absolute inset-0 overflow-hidden grain" style={{ background: `linear-gradient(135deg, ${base}, ${c1}44)` }} aria-hidden="true">
      <span className="ev-blob b1" style={{ background: `radial-gradient(circle at 50% 50%, ${c1}, transparent 68%)` }} />
      <span className="ev-blob b2" style={{ background: `radial-gradient(circle at 50% 50%, ${c2}, transparent 68%)` }} />
      <span className="ev-blob b3" style={{ background: `radial-gradient(circle at 50% 50%, ${c3}, transparent 66%)`, opacity: 0.85 }} />
    </div>
  );
}

function Chip({ children, color = "#fff" }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] tracking-[0.2em] sm:text-[11px]"
      style={{
        fontFamily: "var(--font-mono)",
        color: "#fff",
        background: "rgba(255,255,255,0.14)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {children}
    </span>
  );
}

function EventSlide({ ev, index, total }) {
  const [, c1, c2, c3] = ev.colors;
  return (
    <article
      className="relative h-full w-full overflow-hidden"
      style={{
        borderRadius: 34,
        boxShadow: `0 0 140px -30px ${c2}88, 0 0 0 1px rgba(255,255,255,0.1)`,
      }}
    >
      <Mesh colors={ev.colors} />
      <LiquidGlassSurface
        radius={26}
        blur={26}
        bezel={36}
        refraction={1}
        tilt={2.5}
        className="absolute inset-3 sm:inset-4"
        style={{ background: "rgba(8,8,18,0.34)", color: "#fff" }}
      >
        <div className="h-full w-full overflow-y-auto no-scrollbar p-5 sm:p-8 lg:p-10">
          <div className="grid min-h-full gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            {/* left: identity */}
            <div className="flex flex-col justify-between gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] tracking-[0.3em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.75)" }}>
                  EVENT {ev.no} / {String(total).padStart(2, "0")}
                </span>
                <Chip color={c3}>{ev.category.toUpperCase()}</Chip>
              </div>
              <div>
                <div
                  aria-hidden="true"
                  className="font-bold leading-none"
                  style={{
                    fontSize: "clamp(4rem, 12vw, 9rem)",
                    background: `linear-gradient(180deg, rgba(255,255,255,0.55), ${c3}22)`,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    letterSpacing: "-0.05em",
                  }}
                >
                  {ev.no}
                </div>
                <h2
                  className="mt-1 font-bold leading-[0.95]"
                  style={{ fontSize: "clamp(2.1rem, 5.4vw, 4.6rem)", letterSpacing: "-0.035em", textShadow: "0 4px 30px rgba(0,0,0,0.35)" }}
                >
                  {ev.name}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1.5">
                  {[c1, c2, c3].map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full" style={{ background: c, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7)" }} />
                  ))}
                </div>
                <span className="text-[10px] tracking-[0.16em] sm:text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.7)" }}>
                  {ev.theme.toUpperCase()}
                </span>
              </div>
            </div>

            {/* right: details */}
            <div className="flex flex-col justify-center gap-5">
              <div>
                <div className="mb-2 text-[10px] tracking-[0.3em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.6)" }}>
                  FORMAT
                </div>
                <div className="text-sm font-medium sm:text-base" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                  {ev.format}
                </div>
              </div>
              <p className="text-xl font-semibold leading-snug sm:text-2xl" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
                {ev.summary}
              </p>

              {ev.subTracks && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ev.subTracks.map((t) => (
                    <div
                      key={t.key}
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.1)",
                      }}
                    >
                      <div className="mb-1 text-[10px] tracking-[0.26em]" style={{ fontFamily: "var(--font-mono)", color: c3 }}>
                        SUB-TRACK {t.key}
                      </div>
                      <div className="text-sm font-bold leading-snug">{t.name}</div>
                      <div className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
                        {t.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm leading-relaxed sm:text-base" style={{ color: "rgba(255,255,255,0.84)" }}>
                {ev.description}
              </p>
              <div className="text-[10px] tracking-[0.3em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.5)" }}>
                {String(index + 1).padStart(2, "0")} — {ev.phase === "p1" ? "ONLINE PRELIMS" : "OFFLINE GRAND FINALE"}
              </div>
            </div>
          </div>
        </div>
      </LiquidGlassSurface>
    </article>
  );
}

export default function Events() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [phaseId, setPhaseId] = useState("p1");
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  const idxRef = useRef(0);
  const lockRef = useRef(0);

  const phase = PHASES.find((p) => p.id === phaseId);
  const list = EVENTS.filter((e) => e.phase === phaseId);
  const total = list.length;
  idxRef.current = idx;

  const goTo = useCallback(
    (i) => {
      const el = trackRef.current;
      if (!el) return;
      const c = Math.max(0, Math.min(total - 1, i));
      el.scrollTo({ left: c * el.clientWidth, behavior: "smooth" });
      setIdx(c);
    },
    [total]
  );

  const switchPhase = (id) => {
    if (id === phaseId) return;
    setPhaseId(id);
    setIdx(0);
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    if (i !== idxRef.current) setIdx(i);
  };

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goTo(idxRef.current + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goTo(idxRef.current - 1);
      } else if (e.key === "1") switchPhase("p1");
      else if (e.key === "2") switchPhase("p2");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goTo, phaseId]);

  // wheel (vertical wheel steps through slides)
  const onWheel = (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || Math.abs(e.deltaY) < 8) return;
    const now = performance.now();
    if (now - lockRef.current < 700) return;
    lockRef.current = now;
    goTo(idxRef.current + (e.deltaY > 0 ? 1 : -1));
  };

  return (
    <main
      className="fixed inset-0 z-20 overflow-hidden"
      onWheel={onWheel}
      style={{ background: dark ? "#000000" : "#dcdde4", transition: "background 0.8s ease", color: "#fff" }}
    >
      {/* obsidian gallery frame — pitch black void in dark mode, stark obsidian frame in light mode */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          inset: dark ? 0 : 10,
          borderRadius: dark ? 0 : 36,
          background: "#050507",
          boxShadow: dark ? "none" : "0 40px 90px -30px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.09)",
          transition: "inset 0.8s var(--ease-spring), border-radius 0.8s var(--ease-spring)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col px-3 pb-5 pt-[84px] sm:px-8" style={{ paddingTop: "max(84px, 11dvh)" }}>
        {/* phase filter */}
        <div className="flex flex-col items-center gap-3 text-center">
          <LiquidGlassSurface radius={999} blur={16} refraction={0.6} dispersion={false} bezel={16} style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="relative flex p-1" role="tablist" aria-label="Event phase">
              <span
                aria-hidden="true"
                className="absolute bottom-1 top-1 rounded-full"
                style={{
                  width: "calc(50% - 4px)",
                  left: 4,
                  transform: `translateX(${phaseId === "p1" ? 0 : "100%"})`,
                  transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.32), rgba(255,255,255,0.12))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), 0 6px 20px -6px rgba(0,0,0,0.5)",
                }}
              />
              {PHASES.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={phaseId === p.id}
                  onClick={() => switchPhase(p.id)}
                  className="relative z-10 cursor-pointer rounded-full px-4 py-2.5 text-[10px] tracking-[0.2em] outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:px-6 sm:text-[11px]"
                  style={{ fontFamily: "var(--font-mono)", color: phaseId === p.id ? "#fff" : "rgba(255,255,255,0.6)", transition: "color .4s", flex: 1, whiteSpace: "nowrap" }}
                >
                  {p.pill}
                  <span className="hidden sm:inline"> · {p.id === "p1" ? "ONLINE PRELIMS" : "OFFLINE GRAND FINALE"}</span>
                </button>
              ))}
            </div>
          </LiquidGlassSurface>

          <div key={phaseId} style={{ animation: "fade-up .7s var(--ease-spring) both" }}>
            <div className="text-[10px] tracking-[0.28em] sm:text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.55)" }}>
              {phase.title} — {phase.window.toUpperCase()}
            </div>
            <p className="mx-auto mt-1 max-w-2xl text-sm sm:text-base" style={{ color: "rgba(255,255,255,0.86)" }}>
              {phase.subtitle}
            </p>
          </div>
        </div>

        {/* slides */}
        <div className="relative mt-4 min-h-0 flex-1">
          <div
            key={phaseId}
            ref={trackRef}
            onScroll={onScroll}
            className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
            style={{ scrollbarWidth: "none", animation: "fade-up .8s var(--ease-spring) both" }}
            tabIndex={0}
            aria-label="Event slides"
          >
            {list.map((ev, i) => (
              <section
                key={ev.id}
                className="flex h-full w-full shrink-0 snap-center items-center justify-center sm:px-14"
                aria-label={ev.name}
              >
                <div
                  className="h-full w-full max-w-[1180px]"
                  style={{
                    transform: i === idx ? "scale(1)" : "scale(0.94)",
                    opacity: i === idx ? 1 : 0.55,
                    transition: "transform .7s var(--ease-spring), opacity .7s ease",
                  }}
                >
                  <EventSlide ev={ev} index={i} total={total} />
                </div>
              </section>
            ))}
          </div>

          {/* arrows */}
          {["prev", "next"].map((dir) => {
            const disabled = dir === "prev" ? idx === 0 : idx === total - 1;
            return (
              <button
                key={dir}
                type="button"
                aria-label={dir === "prev" ? "Previous event" : "Next event"}
                onClick={() => goTo(idx + (dir === "prev" ? -1 : 1))}
                disabled={disabled}
                className="absolute top-1/2 z-20 hidden -translate-y-1/2 cursor-pointer outline-none disabled:cursor-default sm:block"
                style={{ [dir === "prev" ? "left" : "right"]: 4, opacity: disabled ? 0.25 : 1, transition: "opacity .4s" }}
              >
                <LiquidGlassSurface radius={999} blur={14} refraction={0.6} dispersion={false} bezel={14} style={{ width: 48, height: 48, background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                  <span className="flex h-full w-full items-center justify-center text-lg">{dir === "prev" ? "←" : "→"}</span>
                </LiquidGlassSurface>
              </button>
            );
          })}
        </div>

        {/* pagination */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="text-[11px] tracking-[0.3em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.6)" }}>
            {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          <div className="flex items-center gap-2">
            {list.map((ev, i) => (
              <button
                key={ev.id}
                type="button"
                aria-label={`Go to ${ev.name}`}
                onClick={() => goTo(i)}
                className="cursor-pointer rounded-full outline-none"
                style={{
                  width: i === idx ? 34 : 8,
                  height: 8,
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "width .6s var(--ease-spring), background .4s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
