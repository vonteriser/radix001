import { useCallback, useRef, useState } from "react";
import LiquidGlassSurface from "../components/LiquidGlassSurface";
import { TEAM } from "../data/radixData";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("");
}

function MemberSlide({ m, i, active }) {
  const [broken, setBroken] = useState(false);
  return (
    <article
      className="relative h-full w-full overflow-hidden"
      style={{
        borderRadius: 34,
        background: `linear-gradient(160deg, ${m.hue}55, #0b1020)`,
        boxShadow: `0 30px 80px -30px ${m.hue}aa, 0 0 0 1px rgba(255,255,255,0.18)`,
      }}
    >
      {!broken ? (
        <img
          src={m.photo}
          alt={m.name}
          draggable={false}
          loading={i < 3 ? "eager" : "lazy"}
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full select-none object-cover"
          style={{
            objectPosition: "50% 22%",
            transform: active ? "scale(1.04)" : "scale(1.12)",
            transition: "transform 1.2s var(--ease-spring)",
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-8xl font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
          {initials(m.name)}
        </div>
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, ${m.hue}22 0%, transparent 35%, rgba(0,0,0,0.5) 100%)` }}
      />

      {/* role badge */}
      <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
        <LiquidGlassSurface radius={999} blur={14} refraction={0.5} dispersion={false} bezel={12} style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}>
          <span
            className="flex items-center gap-2 px-3.5 py-1.5 text-[10px] tracking-[0.26em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: m.hue, boxShadow: `0 0 8px ${m.hue}` }} />
            {m.role}
          </span>
        </LiquidGlassSurface>
      </div>
      <div
        className="absolute right-5 top-5 z-10 text-[11px] tracking-[0.3em]"
        style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.85)", textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}
      >
        {String(i + 1).padStart(2, "0")}
      </div>

      {/* glass nameplate */}
      <LiquidGlassSurface
        radius={26}
        blur={22}
        bezel={30}
        refraction={1}
        tilt={3}
        className="absolute inset-x-3 bottom-3 z-10 sm:inset-x-4 sm:bottom-4"
        style={{ background: "rgba(10,12,24,0.32)", color: "#fff" }}
      >
        <div className="p-5">
          <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl" style={{ textShadow: "0 2px 14px rgba(0,0,0,0.35)" }}>
            {m.name}
          </h2>
          <p className="mt-1.5 text-[13px] leading-snug sm:text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>
            {m.title}
          </p>
        </div>
      </LiquidGlassSurface>
    </article>
  );
}

export default function Team() {
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0 });

  const step = () => {
    const el = trackRef.current;
    if (!el || !el.children[0]) return 1;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return el.children[0].offsetWidth + gap;
  };

  const goTo = useCallback((i) => {
    const el = trackRef.current;
    if (!el) return;
    const c = Math.max(0, Math.min(TEAM.length - 1, i));
    el.scrollTo({ left: c * step(), behavior: "smooth" });
    setIdx(c);
  }, []);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.max(0, Math.min(TEAM.length - 1, Math.round(el.scrollLeft / step())));
    setIdx((cur) => (cur === i ? cur : i));
  };

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    drag.current = { down: true, x: e.clientX, left: trackRef.current.scrollLeft, moved: 0 };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.down) return;
    const dx = e.clientX - d.x;
    d.moved = Math.max(d.moved, Math.abs(dx));
    trackRef.current.scrollLeft = d.left - dx;
  };
  const endDrag = () => {
    if (!drag.current.down) return;
    drag.current.down = false;
    setDragging(false);
    const el = trackRef.current;
    goTo(Math.round(el.scrollLeft / step()));
  };

  const onWheel = (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) trackRef.current?.scrollBy({ left: e.deltaY, behavior: "auto" });
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") goTo(idx + 1);
    if (e.key === "ArrowLeft") goTo(idx - 1);
  };

  return (
    <main className="relative z-10 flex min-h-dvh flex-col px-0 pb-6 pt-24" style={{ color: "var(--fg)" }}>
      <header className="px-5 text-center sm:px-8">
        <p className="mb-2 text-[10px] tracking-[0.34em] sm:text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}>
          RADIX // 01 — THE MINDS BEHIND THE PILOT
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Team</h1>
      </header>

      <div className="relative mt-5 flex-1" style={{ minHeight: 440 }}>
        <div
          ref={trackRef}
          tabIndex={0}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          aria-label="Team member slides"
          className="no-scrollbar absolute inset-0 flex items-center overflow-x-auto overflow-y-hidden outline-none"
          style={{
            columnGap: 24,
            paddingInline: "calc(50% - min(39vw, 205px))",
            scrollSnapType: dragging ? "none" : "x mandatory",
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "pan-x",
          }}
        >
          {TEAM.map((m, i) => (
            <div
              key={m.id}
              className="shrink-0"
              style={{
                width: "min(78vw, 410px)",
                height: "min(100%, 640px)",
                scrollSnapAlign: "center",
                transform: i === idx ? "scale(1)" : "scale(0.9)",
                opacity: i === idx ? 1 : 0.6,
                transition: "transform .7s var(--ease-spring), opacity .7s ease",
              }}
            >
              <MemberSlide m={m} i={i} active={i === idx} />
            </div>
          ))}
        </div>
      </div>

      {/* pagination */}
      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label="Previous member"
          onClick={() => goTo(idx - 1)}
          disabled={idx === 0}
          className="cursor-pointer disabled:cursor-default"
          style={{ opacity: idx === 0 ? 0.3 : 1, transition: "opacity .4s" }}
        >
          <LiquidGlassSurface radius={999} blur={14} refraction={0.6} dispersion={false} bezel={14} style={{ width: 44, height: 44, color: "var(--fg)" }}>
            <span className="flex h-full w-full items-center justify-center">←</span>
          </LiquidGlassSurface>
        </button>
        <div className="flex items-center gap-2">
          {TEAM.map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-label={`Go to ${m.name}`}
              onClick={() => goTo(i)}
              className="cursor-pointer rounded-full"
              style={{
                width: i === idx ? 32 : 8,
                height: 8,
                background: i === idx ? "var(--fg)" : "var(--fg-faint)",
                transition: "width .6s var(--ease-spring), background .4s",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next member"
          onClick={() => goTo(idx + 1)}
          disabled={idx === TEAM.length - 1}
          className="cursor-pointer disabled:cursor-default"
          style={{ opacity: idx === TEAM.length - 1 ? 0.3 : 1, transition: "opacity .4s" }}
        >
          <LiquidGlassSurface radius={999} blur={14} refraction={0.6} dispersion={false} bezel={14} style={{ width: 44, height: 44, color: "var(--fg)" }}>
            <span className="flex h-full w-full items-center justify-center">→</span>
          </LiquidGlassSurface>
        </button>
      </div>
    </main>
  );
}
