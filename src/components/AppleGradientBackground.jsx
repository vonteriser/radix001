import { useEffect, useRef, useState } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import * as THREE from "three";
import gsap from "gsap";
import { useTheme } from "../context/ThemeContext";
import SafeBoundary from "./SafeBoundary";

// Apple-wallpaper inspired palettes: [base, c1, c2, c3] per route + theme.
const PALETTES = {
  home: {
    dark: ["#0b1030", "#3b3fff", "#b44bff", "#ff6a9a"],
    light: ["#e9efff", "#9ec5ff", "#d9b4ff", "#ffc3d9"],
  },
  connect: {
    dark: ["#04161f", "#0aa7c9", "#3d5bff", "#33e0b0"],
    light: ["#e6f8ff", "#8fe1f5", "#a9bcff", "#b5f3dd"],
  },
  timeline: {
    dark: ["#150a2e", "#6b3dff", "#ff4f9a", "#ffb04a"],
    light: ["#f3ecff", "#c4a8ff", "#ffb3d1", "#ffe0a8"],
  },
  team: {
    dark: ["#0b1a1a", "#12b5a4", "#4b7bff", "#f7a8d8"],
    light: ["#e8fbf6", "#9be9d8", "#b6c9ff", "#ffd0ea"],
  },
  register: {
    dark: ["#1a0b1f", "#ff4d8d", "#7a4dff", "#35c7ff"],
    light: ["#fff0f6", "#ffb0cf", "#c5b2ff", "#b2e6ff"],
  },
  notfound: {
    dark: ["#12060b", "#ff3b5c", "#7b2cff", "#ff9a3c"],
    light: ["#fff0ee", "#ffa8a0", "#d0b0ff", "#ffd9a0"],
  },
};

function keyForPath(pathname) {
  if (pathname.startsWith("/connect")) return "connect";
  if (pathname.startsWith("/timeline")) return "timeline";
  if (pathname.startsWith("/team")) return "team";
  if (pathname.startsWith("/register")) return "register";
  if (pathname === "/" || pathname === "") return "home";
  return "notfound";
}

// Smoothly tween between palettes (this is the Dark/Light + route interpolation).
function useTweenedPalette(target) {
  const [palette, setPalette] = useState(target);
  const current = useRef(target.map((c) => new THREE.Color(c)));
  const tween = useRef(null);

  useEffect(() => {
    const from = current.current.map((c) => c.clone());
    const to = target.map((c) => new THREE.Color(c));
    const state = { t: 0 };
    tween.current?.kill();
    tween.current = gsap.to(state, {
      t: 1,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: () => {
        const mixed = from.map((c, i) => c.clone().lerp(to[i], state.t));
        current.current = mixed;
        setPalette(mixed.map((c) => `#${c.getHexString()}`));
      },
    });
    return () => tween.current?.kill();
  }, [target]);

  return palette;
}

export default function AppleGradientBackground({ pathname }) {
  const { theme } = useTheme();
  const key = keyForPath(pathname);
  const target = PALETTES[key][theme];
  const palette = useTweenedPalette(target);
  const parallax = useRef(null);

  // Cursor parallax
  useEffect(() => {
    const el = parallax.current;
    if (!el) return undefined;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -34;
      ty = (e.clientY / window.innerHeight - 0.5) * -34;
    };
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) scale(1.1)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const [c0, c1, c2, c3] = palette;
  const dark = theme === "dark";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div ref={parallax} className="absolute inset-0 will-change-transform">
        {/* CSS mesh: always-on base + fallback when WebGL is unavailable */}
        <div className="mesh-fallback" style={{ "--c0": c0, "--c1": c1, "--c2": c2, "--c3": c3 }} />
        <SafeBoundary>
          <div className="absolute inset-0" style={{ opacity: dark ? 0.9 : 0.8 }}>
            <ShaderGradientCanvas
              style={{ position: "absolute", inset: 0 }}
              pixelDensity={1}
              fov={45}
              pointerEvents="none"
              lazyLoad={false}
            >
              <ShaderGradient
                control="props"
                type="plane"
                animate="on"
                uTime={0}
                uSpeed={0.12}
                uStrength={3.2}
                uDensity={1.2}
                uFrequency={5.5}
                uAmplitude={1}
                positionX={-1.4}
                positionY={0}
                positionZ={0}
                rotationX={0}
                rotationY={10}
                rotationZ={50}
                color1={c1}
                color2={c2}
                color3={c3}
                reflection={0.1}
                wireframe={false}
                cAzimuthAngle={180}
                cPolarAngle={90}
                cDistance={3.6}
                cameraZoom={1}
                lightType="3d"
                brightness={dark ? 1.0 : 1.35}
                envPreset="city"
                grain="off"
              />
            </ShaderGradientCanvas>
          </div>
        </SafeBoundary>
      </div>
      {/* readability veil + grain, theme aware */}
      <div className="absolute inset-0 grain" style={{ background: dark ? "rgba(2,4,10,0.28)" : "rgba(255,255,255,0.1)", transition: "background 0.8s ease" }} />
    </div>
  );
}
