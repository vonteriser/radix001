import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import LiquidGlassSurface from "../components/LiquidGlassSurface";
import { SOCIALS } from "../data/radixData";

/* ------------------------------------------------------------------ *
 *  Geometry helpers                                                   *
 * ------------------------------------------------------------------ */

function insetPolygon(P, d) {
  const n = P.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = P[i];
    const b = P[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sgn = area > 0 ? 1 : -1;
  const lines = P.map((a, i) => {
    const b = P[(i + 1) % n];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey) || 1;
    const nx = (-ey / len) * sgn;
    const ny = (ex / len) * sgn;
    return { px: a[0] + nx * d, py: a[1] + ny * d, dx: ex, dy: ey };
  });
  return P.map((_, i) => {
    const l1 = lines[(i - 1 + n) % n];
    const l2 = lines[i];
    const cross = l1.dx * l2.dy - l1.dy * l2.dx;
    if (Math.abs(cross) < 1e-6) return [l2.px, l2.py];
    const t = ((l2.px - l1.px) * l2.dy - (l2.py - l1.py) * l2.dx) / cross;
    return [l1.px + l1.dx * t, l1.py + l1.dy * t];
  });
}

function roundedPath(P, r, ox, oy) {
  const n = P.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const prev = P[(i - 1 + n) % n];
    const cur = P[i];
    const next = P[(i + 1) % n];
    const l1 = Math.hypot(prev[0] - cur[0], prev[1] - cur[1]) || 1;
    const l2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]) || 1;
    const rr = Math.min(r, l1 / 2, l2 / 2);
    const ax = cur[0] + ((prev[0] - cur[0]) / l1) * rr - ox;
    const ay = cur[1] + ((prev[1] - cur[1]) / l1) * rr - oy;
    const bx = cur[0] + ((next[0] - cur[0]) / l2) * rr - ox;
    const by = cur[1] + ((next[1] - cur[1]) / l2) * rr - oy;
    d += `${i === 0 ? "M" : "L"} ${ax.toFixed(2)} ${ay.toFixed(2)} Q ${(cur[0] - ox).toFixed(2)} ${(cur[1] - oy).toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)} `;
  }
  return `${d}Z`;
}

// Largest axis-aligned rectangle (given aspect) centred on the best "pole" of a convex polygon.
function bestRect(P) {
  const xs = P.map((p) => p[0]);
  const ys = P.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const bw = x1 - x0 || 1;
  const bh = y1 - y0 || 1;
  const ar = Math.min(1.6, Math.max(0.7, bw / bh));
  const n = P.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = P[i];
    const b = P[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sgn = area > 0 ? 1 : -1;
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = P[i];
    const b = P[(i + 1) % n];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey);
    if (len < 0.5) continue;
    edges.push({ ax: a[0], ay: a[1], nx: (-ey / len) * sgn, ny: (ex / len) * sgn });
  }
  let best = { s: 0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  const G = 10;
  for (let i = 0; i <= G; i++) {
    for (let j = 0; j <= G; j++) {
      const cx = x0 + (bw * i) / G;
      const cy = y0 + (bh * j) / G;
      let s = Infinity;
      for (const e of edges) {
        const dist = (cx - e.ax) * e.nx + (cy - e.ay) * e.ny;
        s = Math.min(s, (2 * dist) / (ar * Math.abs(e.nx) + Math.abs(e.ny) || 1));
      }
      if (s > best.s) best = { s, cx, cy };
    }
  }
  const s = Math.max(0, best.s);
  return { cx: best.cx, cy: best.cy, w: s * ar, h: s, x0, y0, bw, bh };
}

/* ------------------------------------------------------------------ *
 *  Six tessellation variants. Every slot list ends with the anchor     *
 *  ("bottom-right") slot which the solver reserves for DISCORD.        *
 * ------------------------------------------------------------------ */

const rect = (W, H, a, b, c, d) => [
  [a * W, b * H],
  [c * W, b * H],
  [c * W, d * H],
  [a * W, d * H],
];

const LAYOUTS = [
  {
    id: "A",
    name: "2×2 CLASSIC QUAD GRID",
    build: (W, H) => ({
      slots: [
        { poly: rect(W, H, 0, 0, 0.5, 0.5) },
        { poly: rect(W, H, 0.5, 0, 1, 0.5) },
        { poly: rect(W, H, 0, 0.5, 0.5, 1) },
        { poly: rect(W, H, 0.5, 0.5, 1, 1), anchor: "bottom-right" },
      ],
    }),
  },
  {
    id: "B",
    name: "ASYMMETRIC BENTO SPLIT",
    build: (W, H) => ({
      slots: [
        { poly: rect(W, H, 0, 0, 0.3, 0.5) },
        { poly: rect(W, H, 0, 0.5, 0.3, 1) },
        { poly: rect(W, H, 0.3, 0, 0.6, 1) },
        { poly: rect(W, H, 0.6, 0.5, 1, 1), anchor: "bottom-right" },
      ],
      hole: rect(W, H, 0.6, 0, 1, 0.5),
    }),
  },
  {
    id: "C",
    name: "DIAGONAL TANGRAM QUAD",
    build: (W, H) => {
      const A = [0, 0];
      const B = [W, 0];
      const C = [W, H];
      const D = [0, H];
      const E = [W * 0.3, H * 0.3];
      return {
        slots: [
          { tri: true, poly: [A, B, E] }, // top
          { tri: true, poly: [A, E, D] }, // left
          { tri: true, poly: [B, D, E] }, // right (diagonal)
          { tri: true, poly: [B, C, D], anchor: "bottom-right" }, // prominent bottom-right
        ],
      };
    },
  },
  {
    id: "D",
    name: "FIBONACCI GOLDEN SPIRAL",
    build: (W, H) => ({
      slots: [
        { poly: rect(W, H, 0, 0, 0.36, 1) },
        { poly: rect(W, H, 0.36, 0, 0.68, 0.3) },
        { poly: rect(W, H, 0.68, 0, 1, 0.3) },
        { poly: rect(W, H, 0.36, 0.3, 1, 1), anchor: "bottom-right" },
      ],
    }),
  },
  {
    id: "E",
    name: "ARCHITECTURAL PILLARS + DOCK",
    build: (W, H) => ({
      slots: [
        { poly: rect(W, H, 0, 0, 0.2, 1) },
        { poly: rect(W, H, 0.2, 0, 0.4, 0.7) },
        { poly: rect(W, H, 0.4, 0, 0.6, 0.7) },
        { poly: rect(W, H, 0.2, 0.7, 1, 1), anchor: "bottom-right" },
      ],
      hole: rect(W, H, 0.6, 0, 1, 0.7),
    }),
  },
  {
    id: "F",
    name: "ANGLED PARALLELOGRAM SLANTS",
    build: (W, H) => {
      const k = W < 640 ? 0.12 : 0.2;
      const pad = (k * H) / 2;
      const x = (f) => pad + f * (W - 2 * pad);
      const sh = (yy) => k * (H / 2 - yy);
      const cell = (c, r) => {
        const xa = x(c / 2);
        const xb = x((c + 1) / 2);
        const ya = (r * H) / 2;
        const yb = ((r + 1) * H) / 2;
        return [
          [xa + sh(ya), ya],
          [xb + sh(ya), ya],
          [xb + sh(yb), yb],
          [xa + sh(yb), yb],
        ];
      };
      return {
        slots: [
          { poly: cell(0, 0) },
          { poly: cell(1, 0) },
          { poly: cell(0, 1) },
          { poly: cell(1, 1), anchor: "bottom-right" },
        ],
      };
    },
  },
];

function gutterFor(W) {
  if (W < 600) return 16;
  if (W < 1100) return 20;
  return 24;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Spatial anchor priority solver: any social with preferredAnchor is pinned to
// the matching slot in EVERY layout; the rest permute across remaining slots.
function solveAssignment(layout, socials) {
  const slots = layout.build(1000, 600).slots;
  const pool = shuffle(socials.filter((s) => !s.preferredAnchor));
  const pinned = socials.filter((s) => s.preferredAnchor);
  return slots.map((slot) => {
    const pin = pinned.find((p) => p.preferredAnchor === slot.anchor);
    return pin ?? pool.pop();
  });
}

function computeTargets(layout, assignment, W, H) {
  const g = gutterFor(W);
  const { slots, hole } = layout.build(W, H);
  const out = {};
  slots.forEach((slot, i) => {
    let P = insetPolygon(slot.poly, g / 2);
    if (slot.tri) P = [P[0], P[1], P[2], [(P[2][0] + P[0][0]) / 2, (P[2][1] + P[0][1]) / 2]];
    out[assignment[i].id] = { pts: P, r: slot.tri ? 20 : 26, anchor: !!slot.anchor, tri: !!slot.tri };
  });
  const holeRect = hole ? insetPolygon(hole, g / 2) : null;
  return { cards: out, hole: holeRect };
}

/* ------------------------------------------------------------------ *
 *  Social glyphs + live counters                                       *
 * ------------------------------------------------------------------ */

function SocialIcon({ id, size = 34 }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (id) {
    case "whatsapp":
      return (
        <svg {...p}>
          <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" />
          <path d="M9 8.5c.3 2.7 2.8 5.2 5.8 6l1.3-1.5-2-1-1 .6a5 5 0 0 1-2-2l.6-1-1-2Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...p}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="0.9" fill="currentColor" />
        </svg>
      );
    case "discord":
      return (
        <svg {...p}>
          <path d="M7.5 6.2c1.4-.6 2.8-.9 4.5-.9s3.1.3 4.5.9c1.7 2.4 2.6 5 2.9 8.2-1.1.8-2.3 1.4-3.6 1.8l-.9-1.5c.5-.2.9-.4 1.3-.7-1.3.5-2.7.8-4.2.8s-2.9-.3-4.2-.8c.4.3.8.5 1.3.7l-.9 1.5c-1.3-.4-2.5-1-3.6-1.8.3-3.2 1.2-5.8 2.9-8.2Z" />
          <circle cx="9.2" cy="11.8" r="1.1" />
          <circle cx="14.8" cy="11.8" r="1.1" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path d="M21.5 3.5 2.8 10.7c-.9.4-.9 1.1-.2 1.3l4.7 1.5 1.8 5.5c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8L22.7 5c.3-1.2-.4-1.7-1.2-1.5Z" />
          <path d="m7.3 13.5 9.9-6.2-7.3 8.4" />
        </svg>
      );
  }
}

function useLiveCount(base) {
  const [n, setN] = useState(base);
  useEffect(() => {
    const id = window.setInterval(
      () => setN((v) => Math.max(Math.round(base * 0.9), Math.round(v + (Math.random() - 0.45) * base * 0.012))),
      3200 + Math.random() * 2600
    );
    return () => window.clearInterval(id);
  }, [base]);
  return n;
}

function CardBody({ social, w, h, anchor }) {
  const live = useLiveCount(social.base);
  const mn = Math.min(w, h);
  const level = mn < 110 ? 0 : mn < 175 ? 1 : 2;
  const iconSize = mn < 110 ? 26 : mn < 175 ? 32 : Math.min(54, mn * 0.24);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center" style={{ color: "var(--fg)" }}>
      <div
        style={{
          color: social.accent,
          filter: `drop-shadow(0 0 ${anchor ? 16 : 10}px ${social.accent})`,
          transition: "transform .4s var(--ease-spring)",
        }}
      >
        <SocialIcon id={social.id} size={iconSize} />
      </div>
      {level >= 1 && (
        <div
          className="mt-2 font-bold"
          style={{ fontSize: Math.max(11, Math.min(anchor ? 30 : 22, mn * 0.11)), letterSpacing: "0.12em" }}
        >
          {social.name}
        </div>
      )}
      {level >= 2 && (
        <>
          <div className="mt-1 max-w-full truncate" style={{ fontFamily: "var(--font-mono)", fontSize: Math.max(10, Math.min(14, mn * 0.06)), color: "var(--fg-dim)" }}>
            {social.handle}
          </div>
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.1em",
              background: "var(--glass-bg-strong)",
              boxShadow: "inset 0 1px 0 var(--glass-spec)",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: social.accent, boxShadow: `0 0 8px ${social.accent}`, animation: "pulse-dot 2s infinite" }}
            />
            {live.toLocaleString()} {social.status}
          </div>
          {anchor && mn > 200 && (
            <div className="mt-3 text-[9px] tracking-[0.3em]" style={{ fontFamily: "var(--font-mono)", color: social.accent }}>
              ◆ PRIMARY COMMAND HUB
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Page                                                               *
 * ------------------------------------------------------------------ */

function pickLayout(exclude) {
  const pool = LAYOUTS.filter((l) => l.id !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function Connect() {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ W: 0, H: 0 });
  const [layout, setLayout] = useState(() => LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]);
  const [assignment, setAssignment] = useState(() => solveAssignment(layout, SOCIALS));
  const [shapes, setShapes] = useState(null); // {cards, hole}
  const current = useRef(null);
  const sig = useRef("");
  const tween = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const W = Math.round(entry.contentRect.width);
      const H = Math.round(entry.contentRect.height);
      setBox((b) => (b.W === W && b.H === H ? b : { W, H }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const recompile = useCallback(() => {
    const next = pickLayout(layout.id);
    setLayout(next);
    setAssignment(solveAssignment(next, SOCIALS));
  }, [layout.id]);

  useEffect(() => {
    const { W, H } = box;
    if (!W || !H) return undefined;
    const target = computeTargets(layout, assignment, W, H);
    const newSig = layout.id + assignment.map((a) => a.id).join("");
    const changed = newSig !== sig.current;
    sig.current = newSig;
    tween.current?.kill();

    const prev = current.current;
    const snap = () => {
      current.current = target;
      setShapes(target);
    };
    if (!changed && prev) {
      snap();
      return undefined;
    }

    // from: previous layout, or an "assembling" collapsed copy on first mount
    const cx = W / 2;
    const cy = H / 2;
    const from = {};
    Object.entries(target.cards).forEach(([id, t]) => {
      from[id] = prev?.cards?.[id]
        ? prev.cards[id]
        : { ...t, pts: t.pts.map(([x, y]) => [cx + (x - cx) * 0.55, cy + (y - cy) * 0.55]) };
    });
    const state = { t: 0 };
    tween.current = gsap.to(state, {
      t: 1,
      duration: prev ? 1.1 : 1.2,
      ease: "power4.out",
      onUpdate: () => {
        const k = state.t;
        const cards = {};
        Object.entries(target.cards).forEach(([id, t]) => {
          const f = from[id];
          cards[id] = {
            ...t,
            r: f.r + (t.r - f.r) * k,
            pts: t.pts.map((p, i) => [f.pts[i][0] + (p[0] - f.pts[i][0]) * k, f.pts[i][1] + (p[1] - f.pts[i][1]) * k]),
          };
        });
        const frame = { cards, hole: target.hole, k };
        current.current = frame;
        setShapes(frame);
      },
      onComplete: () => {
        current.current = target;
        setShapes(target);
      },
    });
    return () => tween.current?.kill();
  }, [layout, assignment, box]);

  const cards = useMemo(() => {
    if (!shapes) return [];
    return SOCIALS.map((s) => {
      const sh = shapes.cards[s.id];
      if (!sh) return null;
      const P = sh.pts;
      const xs = P.map((p) => p[0]);
      const ys = P.map((p) => p[1]);
      const ox = Math.min(...xs);
      const oy = Math.min(...ys);
      const bw = Math.max(...xs) - ox;
      const bh = Math.max(...ys) - oy;
      const path = roundedPath(P, sh.r, ox, oy);
      const br = bestRect(P);
      const pad = 10;
      const cw = Math.max(0, br.w * 0.94 - pad * 2);
      const ch = Math.max(0, br.h * 0.94 - pad * 2);
      return { s, ox, oy, bw, bh, path, content: { x: br.cx - ox - cw / 2, y: br.cy - oy - ch / 2, w: cw, h: ch }, anchor: sh.anchor };
    }).filter(Boolean);
  }, [shapes]);

  return (
    <main className="relative z-10 min-h-dvh px-4 pb-24 pt-24 sm:px-8" style={{ color: "var(--fg)" }}>
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] tracking-[0.34em] sm:text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--fg-dim)" }}>
              RADIX // 01 — SOCIAL MATRIX
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Connect</h1>
          </div>
          <LiquidGlassSurface
            as="button"
            type="button"
            onClick={recompile}
            radius={999}
            blur={14}
            refraction={0.6}
            dispersion={false}
            bezel={14}
            className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ color: "var(--fg)", padding: 0, display: "block" }}
          >
            <span className="flex items-center gap-2 px-5 py-2.5 text-[11px] tracking-[0.24em]" style={{ fontFamily: "var(--font-mono)" }}>
              <span aria-hidden="true">⟲</span> RECOMPILE LAYOUT
            </span>
          </LiquidGlassSurface>
        </header>

        <div
          ref={boxRef}
          className="relative w-full"
          style={{ height: "clamp(520px, calc(100dvh - 250px), 900px)" }}
        >
          {shapes?.hole && (
            <div
              className="pointer-events-none absolute flex flex-col justify-end"
              style={{
                left: Math.min(...shapes.hole.map((p) => p[0])),
                top: Math.min(...shapes.hole.map((p) => p[1])),
                width: Math.max(...shapes.hole.map((p) => p[0])) - Math.min(...shapes.hole.map((p) => p[0])),
                height: Math.max(...shapes.hole.map((p) => p[1])) - Math.min(...shapes.hole.map((p) => p[1])),
                padding: 8,
                color: "var(--fg-dim)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div className="text-[10px] tracking-[0.3em]">LAYOUT {layout.id} / 06</div>
              <div className="mt-1 text-xs tracking-[0.18em]" style={{ color: "var(--fg)" }}>
                {layout.name}
              </div>
              <div className="mt-2 text-[10px] leading-relaxed tracking-[0.1em]">
                ◆ DISCORD ANCHORED · BOTTOM-RIGHT
              </div>
            </div>
          )}

          {cards.map(({ s, ox, oy, bw, bh, path, content, anchor }) => (
            <LiquidGlassSurface
              key={s.id}
              as="a"
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.name} — ${s.handle}`}
              radius={0}
              blur={18}
              bezel={30}
              refraction={1}
              tilt={anchor ? 4 : 6}
              ripple
              rimPath={path}
              rimColor={anchor ? s.accent : undefined}
              className="absolute block cursor-pointer outline-none"
              style={{
                left: ox,
                top: oy,
                width: bw,
                height: bh,
                clipPath: `path('${path}')`,
                WebkitClipPath: `path('${path}')`,
                background: anchor
                  ? `linear-gradient(135deg, ${s.accent}38, var(--glass-bg) 70%)`
                  : "var(--glass-bg)",
                boxShadow: "none",
                color: "var(--fg)",
                willChange: "clip-path, left, top, width, height",
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(90% 90% at 0% 0%, ${s.accent}${anchor ? "40" : "26"}, transparent 62%)` }}
              />
              <div className="absolute" style={{ left: content.x, top: content.y, width: content.w, height: content.h }}>
                <CardBody social={s} w={content.w} h={content.h} anchor={anchor} />
              </div>
            </LiquidGlassSurface>
          ))}
        </div>
      </div>
    </main>
  );
}
