import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * LiquidGlassSurface — self-contained take on dashersw/liquid-glass-js.
 *
 * Instead of rasterising the DOM into WebGL, we use the same refraction
 * principle with an SVG <feDisplacementMap> driven by a generated bezel map
 * (the centre is neutral, the edges bend the backdrop like thick glass), three
 * per-channel displacements for chromatic dispersion, plus:
 *   - dynamic backdrop-filter blur / saturation
 *   - an edge specular rim that follows the cursor
 *   - a pointer-tracked sheen and optional 3D mouse tilt
 *   - click/hover refraction ripples
 * Browsers without SVG backdrop filters (Safari / Firefox) gracefully fall back
 * to the pure blur + rim + sheen stack.
 */

const SVG_BACKDROP_OK =
  typeof navigator !== "undefined" &&
  /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent) &&
  !/OPR\/|Firefox\//.test(navigator.userAgent);

function buildBezelMap(w, h, bezel) {
  const bx = Math.min(0.5, bezel / w);
  const by = Math.min(0.5, bezel / h);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>` +
    `<linearGradient id="gx" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="rgb(0,0,0)"/>` +
    `<stop offset="${bx.toFixed(4)}" stop-color="rgb(128,0,0)"/>` +
    `<stop offset="${(1 - bx).toFixed(4)}" stop-color="rgb(128,0,0)"/>` +
    `<stop offset="1" stop-color="rgb(255,0,0)"/>` +
    `</linearGradient>` +
    `<linearGradient id="gy" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="rgb(0,0,0)"/>` +
    `<stop offset="${by.toFixed(4)}" stop-color="rgb(0,128,0)"/>` +
    `<stop offset="${(1 - by).toFixed(4)}" stop-color="rgb(0,128,0)"/>` +
    `<stop offset="1" stop-color="rgb(0,255,0)"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="${w}" height="${h}" fill="rgb(0,0,0)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#gx)"/>` +
    `<rect width="${w}" height="${h}" fill="url(#gy)" style="mix-blend-mode:screen"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const LiquidGlassSurface = forwardRef(function LiquidGlassSurface(
  {
    as: Tag = "div",
    className = "",
    style,
    radius = 28,
    blur = 16,
    saturate = 1.7,
    refraction = 1,
    dispersion = true,
    bezel,
    tilt = 0,
    sheen = true,
    rim = true,
    ripple = false,
    rimPath,
    rimColor,
    children,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    ...rest
  },
  forwardedRef
) {
  const elRef = useRef(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterId = `lgf${uid}`;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  const setRefs = useCallback(
    (node) => {
      elRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  // Track size (debounced) so the displacement map matches the element.
  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    let timer = 0;
    let first = true;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      const next = { w: Math.round(box.width), h: Math.round(box.height) };
      const apply = () =>
        setSize((prev) => (Math.abs(prev.w - next.w) < 2 && Math.abs(prev.h - next.h) < 2 ? prev : next));
      window.clearTimeout(timer);
      if (first) {
        first = false;
        apply();
      } else {
        timer = window.setTimeout(apply, 90);
      }
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  const useSvg = SVG_BACKDROP_OK && refraction > 0 && size.w > 8 && size.h > 8;

  const bezelPx = bezel ?? Math.max(10, Math.min(34, Math.min(size.w, size.h) * 0.12));
  const scale = bezelPx * 1.35 * refraction;

  const mapUrl = useMemo(
    () => (useSvg ? buildBezelMap(size.w, size.h, bezelPx) : ""),
    [useSvg, size.w, size.h, bezelPx]
  );

  const backdrop = useSvg
    ? `url(#${filterId}) blur(${Math.max(3, blur * 0.55)}px) saturate(${saturate}) brightness(1.06)`
    : `blur(${blur}px) saturate(${saturate}) brightness(1.06)`;

  const handleMove = (e) => {
    const el = elRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / Math.max(1, r.width);
      const py = (e.clientY - r.top) / Math.max(1, r.height);
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--nx", ((px - 0.5) * 2).toFixed(3));
      el.style.setProperty("--ny", ((py - 0.5) * 2).toFixed(3));
      if (tilt > 0) {
        el.style.transition = "transform 0.12s ease-out, box-shadow 0.4s ease, background-color 0.6s ease";
        el.style.transform = `perspective(1100px) rotateX(${((0.5 - py) * tilt).toFixed(2)}deg) rotateY(${(
          (px - 0.5) *
          tilt
        ).toFixed(2)}deg)`;
      }
      if (ripple && Math.random() < 0.035) spawnRipple(e.clientX - r.left, e.clientY - r.top);
    }
    onPointerMove?.(e);
  };

  const spawnRipple = (x, y) => {
    const id = ++rippleId.current;
    setRipples((list) => [...list.slice(-3), { id, x, y }]);
    window.setTimeout(() => setRipples((list) => list.filter((r) => r.id !== id)), 1000);
  };

  const handleEnter = (e) => {
    const el = elRef.current;
    if (el) {
      el.style.setProperty("--sheen-o", "1");
      if (ripple) {
        const r = el.getBoundingClientRect();
        spawnRipple(e.clientX - r.left, e.clientY - r.top);
      }
    }
    onPointerEnter?.(e);
  };

  const handleLeave = (e) => {
    const el = elRef.current;
    if (el) {
      el.style.setProperty("--sheen-o", "0");
      el.style.setProperty("--nx", "0");
      el.style.setProperty("--ny", "0");
      if (tilt > 0) {
        el.style.transition = "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease, background-color 0.6s ease";
        el.style.transform = "perspective(1100px) rotateX(0deg) rotateY(0deg)";
      }
    }
    onPointerLeave?.(e);
  };

  const merged = {
    borderRadius: radius,
    backdropFilter: backdrop,
    WebkitBackdropFilter: backdrop,
    ...style,
  };

  return (
    <Tag
      ref={setRefs}
      className={`lg-surface ${className}`}
      style={merged}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {useSvg && (
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
          colorInterpolationFilters="sRGB"
        >
          <defs>
            <filter
              id={filterId}
              x={-600}
              y={-600}
              width={size.w + 1200}
              height={size.h + 1200}
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={mapUrl}
                x="0"
                y="0"
                width={size.w}
                height={size.h}
                preserveAspectRatio="none"
                result="map"
              />
              {dispersion ? (
                <>
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" result="dR" />
                  <feColorMatrix
                    in="dR"
                    type="matrix"
                    values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="cR"
                  />
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * 0.9} xChannelSelector="R" yChannelSelector="G" result="dG" />
                  <feColorMatrix
                    in="dG"
                    type="matrix"
                    values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                    result="cG"
                  />
                  <feDisplacementMap in="SourceGraphic" in2="map" scale={scale * 0.8} xChannelSelector="R" yChannelSelector="G" result="dB" />
                  <feColorMatrix
                    in="dB"
                    type="matrix"
                    values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                    result="cB"
                  />
                  <feBlend in="cR" in2="cG" mode="screen" result="rg" />
                  <feBlend in="rg" in2="cB" mode="screen" />
                </>
              ) : (
                <feDisplacementMap in="SourceGraphic" in2="map" scale={scale} xChannelSelector="R" yChannelSelector="G" />
              )}
            </filter>
          </defs>
        </svg>
      )}

      <div className="lg-tint" aria-hidden="true" />
      {sheen && <div className="lg-sheen" aria-hidden="true" />}
      {rim && !rimPath && <div className="lg-rim" aria-hidden="true" />}

      {rimPath && (
        <svg
          aria-hidden="true"
          className="absolute inset-0 z-[3] pointer-events-none"
          width="100%"
          height="100%"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id={`rg${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={rimColor || "var(--glass-rim)"} />
              <stop offset="0.35" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="0.65" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="1" stopColor="var(--glass-rim-soft)" />
            </linearGradient>
          </defs>
          <path d={rimPath} fill="none" stroke={`url(#rg${uid})`} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      )}

      {ripples.map((r) => (
        <span key={r.id} className="lg-ripple" style={{ left: r.x, top: r.y }} aria-hidden="true" />
      ))}

      <div className="lg-content" style={{ width: "100%", height: "100%" }}>
        {children}
      </div>
    </Tag>
  );
});

export default LiquidGlassSurface;
