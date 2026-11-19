import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LiquidGlassSurface from "./LiquidGlassSurface";
import { EVENT, SECTIONS } from "../data/radixData";

const C = 250; // viewBox centre
const R_OUT = 244;
const R_IN = 122;
const GAP = 2.4; // degrees between wedges
const SECTOR = 360 / SECTIONS.length;

const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
};

function wedgePath(i) {
  const a0 = i * SECTOR - SECTOR / 2 + GAP;
  const a1 = i * SECTOR + SECTOR / 2 - GAP;
  const [ox0, oy0] = polar(R_OUT, a0);
  const [ox1, oy1] = polar(R_OUT, a1);
  const [ix1, iy1] = polar(R_IN, a1);
  const [ix0, iy0] = polar(R_IN, a0);
  return `M ${ox0} ${oy0} A ${R_OUT} ${R_OUT} 0 0 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${R_IN} ${R_IN} 0 0 0 ${ix0} ${iy0} Z`;
}

export function SectionIcon({ id, size = 24, stroke = 1.7 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (id) {
    case "connect":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.4" />
          <circle cx="19" cy="5" r="2.4" />
          <circle cx="19" cy="19" r="2.4" />
          <path d="M7.2 11 16.8 6M7.2 13l9.6 5" />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path d="m3 12.5 9 5 9-5M3 17l9 5 9-5" />
        </svg>
      );
    case "timeline":
      return (
        <svg {...common}>
          <path d="M3 12h18" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M6 6v4M12 14v4M18 6v4" />
        </svg>
      );
    case "team":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16.2 14.2c2.8.2 4.8 2.4 4.8 5.8" />
        </svg>
      );
    case "register":
    default:
      return (
        <svg {...common}>
          <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
          <circle cx="9" cy="12" r="2" />
          <path d="M14 10.5h4M14 13.5h3" />
        </svg>
      );
  }
}

export default function RadialWheel({ revealed = true, onSelect }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState(null);
  const [launch, setLaunch] = useState(null);
  const [sweep, setSweep] = useState(0);
  const sweepRot = useRef(0);
  const drag = useRef({ down: false, moved: 0, x: 0, y: 0 });
  const activeRef = useRef(null);
  activeRef.current = active;
  const launchRef = useRef(null);
  launchRef.current = launch;

  const go = useCallback(
    (idx) => {
      if (launchRef.current !== null || idx === null || idx === undefined) return;
      const rect = rootRef.current?.getBoundingClientRect();
      const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      setLaunch(idx);
      setActive(idx);
      onSelect?.(SECTIONS[idx], cx, cy);
    },
    [onSelect]
  );

  // rotational light sweep follows the active wedge by the shortest arc
  useEffect(() => {
    if (active === null) return;
    const target = active * SECTOR;
    const d = ((((target - sweepRot.current) % 360) + 540) % 360) - 180;
    sweepRot.current += d;
    setSweep(sweepRot.current);
  }, [active]);

  // keyboard + scroll wheel
  useEffect(() => {
    const step = (dir) =>
      setActive((cur) => {
        if (cur === null) return dir > 0 ? 0 : SECTIONS.length - 1;
        return (cur + dir + SECTIONS.length) % SECTIONS.length;
      });
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Enter" || e.key === " ") {
        if (activeRef.current !== null) {
          e.preventDefault();
          go(activeRef.current);
        }
      } else if (e.key === "Escape") {
        setActive(null);
      }
    };
    let acc = 0;
    let last = 0;
    const onWheel = (e) => {
      acc += e.deltaY + e.deltaX;
      const now = performance.now();
      if (Math.abs(acc) > 50 && now - last > 140) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
        last = now;
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [go]);

  const locate = (e) => {
    const r = rootRef.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const dist = Math.hypot(dx, dy) / (r.width / 2);
    const ang = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    return { dist, idx: Math.round(ang / SECTOR) % SECTIONS.length };
  };

  const hubFrac = R_IN / R_OUT;

  const onPointerMove = (e) => {
    if (launchRef.current !== null) return;
    const { dist, idx } = locate(e);
    const d = drag.current;
    if (d.down) {
      d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.x, e.clientY - d.y));
      if (dist > 0.18) setActive(idx);
    } else if (dist <= 1.02 && dist >= hubFrac * 0.97) {
      setActive(idx);
    } else if (dist < hubFrac * 0.97 && e.pointerType === "mouse") {
      setActive(null);
    }
  };

  const onPointerDown = (e) => {
    drag.current = { down: true, moved: 0, x: e.clientX, y: e.clientY };
    try {
      rootRef.current.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const { dist, idx } = locate(e);
    if (dist >= hubFrac * 0.97 && dist <= 1.02) setActive(idx);
  };

  const onPointerUp = (e) => {
    drag.current.down = false;
    try {
      rootRef.current.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onClick = (e) => {
    if (drag.current.moved > 8) return;
    const { dist, idx } = locate(e);
    if (dist >= hubFrac * 0.97 && dist <= 1.02) go(idx);
    else if (dist < hubFrac * 0.97 && activeRef.current !== null) go(activeRef.current);
  };

  const section = active !== null ? SECTIONS[active] : null;
  const ringMask = `radial-gradient(circle closest-side, transparent ${(hubFrac * 100 - 1).toFixed(1)}%, #000 ${(hubFrac * 100).toFixed(1)}%, #000 98.5%, transparent 100%)`;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={revealed ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 70, damping: 15, mass: 1.1 }}
      style={{ width: "min(88vw, calc(100dvh - 270px), 640px)", minWidth: 280 }}
    >
      <div
        ref={rootRef}
        role="group"
        aria-label="Festival navigation wheel"
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !drag.current.down && launchRef.current === null) setActive(null);
        }}
        onClick={onClick}
        className="relative aspect-square w-full select-none"
        style={{
          containerType: "inline-size",
          touchAction: "none",
          cursor: active !== null ? "pointer" : "default",
          transform: launch !== null ? "scale(1.18)" : "scale(1)",
          transition: "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* outer refractive glass disc */}
        <LiquidGlassSurface
          radius="50%"
          blur={18}
          bezel={44}
          refraction={1.1}
          className="absolute inset-0"
          style={{ boxShadow: "0 40px 120px -30px var(--glass-shadow), inset 0 1px 0 var(--glass-spec), inset 0 0 60px rgba(255,255,255,0.08)" }}
        />

        {/* idle glint */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            opacity: active === null ? 0.5 : 0,
            transition: "opacity .6s ease",
            WebkitMaskImage: ringMask,
            maskImage: ringMask,
            background:
              "conic-gradient(from -20deg, transparent 0deg, rgba(255,255,255,0.0) 10deg, rgba(255,255,255,0.7) 28deg, transparent 52deg, transparent 180deg, rgba(255,255,255,0.35) 215deg, transparent 240deg)",
            animation: "spin-slow 16s linear infinite",
          }}
        />

        {/* rotational light sweep */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            opacity: active !== null ? 1 : 0,
            transform: `rotate(${sweep}deg)`,
            transition: "transform .75s cubic-bezier(0.22, 1, 0.36, 1), opacity .4s ease",
            WebkitMaskImage: ringMask,
            maskImage: ringMask,
            background: `conic-gradient(from -${SECTOR / 2}deg, transparent 0deg, rgba(255,255,255,0.0) 6deg, ${
              section ? `${section.accent}aa` : "rgba(255,255,255,.5)"
            } 22deg, rgba(255,255,255,0.95) 36deg, ${
              section ? `${section.accent}88` : "rgba(255,255,255,.4)"
            } 50deg, rgba(255,255,255,0) 66deg, transparent ${SECTOR}deg)`,
            mixBlendMode: "screen",
          }}
        />

        {/* wedges */}
        <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full" style={{ overflow: "visible" }} aria-hidden="true">
          <defs>
            {SECTIONS.map((s, i) => (
              <radialGradient key={s.id} id={`wg-${s.id}`} cx="50%" cy="50%" r="50%" gradientUnits="userSpaceOnUse" fx={polar(185, i * SECTOR)[0]} fy={polar(185, i * SECTOR)[1]}>
                <stop offset="0" stopColor={s.accent} stopOpacity="0.55" />
                <stop offset="1" stopColor={s.accent} stopOpacity="0.12" />
              </radialGradient>
            ))}
          </defs>
          {SECTIONS.map((s, i) => {
            const on = active === i;
            const [lx, ly] = polar(184, i * SECTOR);
            return (
              <g
                key={s.id}
                style={{
                  transformOrigin: `${C}px ${C}px`,
                  transform: on ? "scale(1.05)" : "scale(1)",
                  transition: "transform .45s cubic-bezier(0.22, 1, 0.36, 1)",
                  filter: on ? `drop-shadow(0 0 16px ${s.accent})` : "none",
                  opacity: launch !== null && launch !== i ? 0.15 : 1,
                }}
              >
                <path
                  d={wedgePath(i)}
                  fill={on ? `url(#wg-${s.id})` : "rgba(255,255,255,0.045)"}
                  stroke={on ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)"}
                  strokeWidth={on ? 2 : 1.2}
                  style={{ transition: "fill .35s ease, stroke .35s ease" }}
                />
                <g transform={`translate(${lx} ${ly})`} style={{ color: on ? "#fff" : "var(--fg)" }}>
                  <g transform="translate(-14 -24) scale(1.17)" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: on ? 1 : 0.85 }}>
                    <IconPaths id={s.id} />
                  </g>
                  <text
                    x="0"
                    y="24"
                    textAnchor="middle"
                    fill="currentColor"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 15.5,
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      opacity: on ? 1 : 0.88,
                    }}
                  >
                    {s.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* centre hub HUD */}
        <LiquidGlassSurface
          radius="50%"
          blur={26}
          bezel={30}
          refraction={0.9}
          className="absolute"
          style={{
            left: `${((C - 112) / 500) * 100}%`,
            top: `${((C - 112) / 500) * 100}%`,
            width: `${(224 / 500) * 100}%`,
            height: `${(224 / 500) * 100}%`,
            background: "var(--glass-bg-strong)",
          }}
        >
          <div
            key={section ? section.id : "idle"}
            className="flex h-full w-full flex-col items-center justify-center text-center"
            style={{
              padding: "9%",
              color: "var(--fg)",
              animation: "fade-up .5s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          >
            {section ? (
              <>
                <div style={{ color: section.accent, filter: `drop-shadow(0 0 10px ${section.accent})` }}>
                  <SectionIcon id={section.id} size={30} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "clamp(14px, 4.2cqw, 28px)",
                    letterSpacing: "0.06em",
                    marginTop: "3%",
                  }}
                >
                  {section.label}
                </div>
                <div style={{ fontSize: "clamp(8px, 1.85cqw, 12.5px)", lineHeight: 1.35, color: "var(--fg-dim)", marginTop: "3%", maxWidth: "92%" }}>
                  {section.preview}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(7px, 1.35cqw, 10px)", letterSpacing: "0.22em", color: section.accent, marginTop: "5%" }}>
                  CLICK TO ENTER
                </div>
              </>
            ) : (
              <>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(8px, 1.7cqw, 12px)", letterSpacing: "0.3em", color: "var(--fg-dim)" }}>
                  {EVENT.short}
                </div>
                <div style={{ width: "28%", height: 1, background: "var(--glass-rim-soft)", margin: "4% 0" }} />
                <div className="hub-short" style={{ fontSize: "clamp(9px, 2.6cqw, 14px)", lineHeight: 1.3, fontWeight: 500 }}>
                  {EVENT.shortLiner}
                </div>
                <div className="hub-long" style={{ fontSize: "clamp(9px, 1.75cqw, 12.5px)", lineHeight: 1.4, color: "var(--fg)", fontWeight: 500 }}>
                  “{EVENT.oneLiner}”
                </div>
              </>
            )}
          </div>
        </LiquidGlassSurface>
      </div>
    </motion.div>
  );
}

// Raw icon geometry reused inside the SVG wheel (24×24 grid)
function IconPaths({ id }) {
  switch (id) {
    case "connect":
      return (
        <>
          <circle cx="5" cy="12" r="2.4" />
          <circle cx="19" cy="5" r="2.4" />
          <circle cx="19" cy="19" r="2.4" />
          <path d="M7.2 11 16.8 6M7.2 13l9.6 5" />
        </>
      );
    case "events":
      return (
        <>
          <path d="M12 3 3 8l9 5 9-5-9-5Z" />
          <path d="m3 12.5 9 5 9-5M3 17l9 5 9-5" />
        </>
      );
    case "timeline":
      return (
        <>
          <path d="M3 12h18" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M6 6v4M12 14v4M18 6v4" />
        </>
      );
    case "team":
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16.2 14.2c2.8.2 4.8 2.4 4.8 5.8" />
        </>
      );
    default:
      return (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2.5" />
          <circle cx="9" cy="12" r="2" />
          <path d="M14 10.5h4M14 13.5h3" />
        </>
      );
  }
}
