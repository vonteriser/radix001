import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import LiquidGlassSurface from "./LiquidGlassSurface";
import SafeBoundary from "./SafeBoundary";

/* ------------------------------------------------------------------ *
 *  Liquid rope — adapted from the procedural spline morphing idea of   *
 *  collidingScopes/liquid-logo: a single tubular rope whose centre     *
 *  line is blended (per-sample, staggered) between a trefoil knot,     *
 *  a flowing wave and the polyline skeleton of R-A-D-I-X. Pen-lift     *
 *  connectors between strokes pinch to zero radius like liquid         *
 *  breaking apart.                                                    *
 * ------------------------------------------------------------------ */

const N = 560; // samples along the rope
const RADIAL = 10; // tube cross-section segments
const STAGGER = 0.9;

// Timeline (seconds)
const T_WAVE0 = 1.3;
const T_WAVE_D = 1.7;
const T_LET0 = 2.9;
const T_LET_D = 2.0;
const T_LOCK = 5.0;
const HOLD = 0.6;
const T_TUNNEL = T_LOCK + HOLD;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => v * v * (3 - 2 * v);
const easeOutCubic = (v) => 1 - Math.pow(1 - v, 3);

function arc(cx, cy, rx, ry, a0, a1, n = 16) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

// Letter skeletons in a 2-unit tall box. Strokes are continuous polylines.
const LETTERS = [
  {
    // R
    x: 0,
    strokes: [[[0, 0], [0, 2], [0.5, 2], ...arc(0.5, 1.5, 0.5, 0.5, 90, -90, 14), [0.3, 1.0], [0.95, 0]]],
  },
  {
    // A
    x: 1.5,
    strokes: [[[0, 0], [0.5, 2], [1, 0], [0.8625, 0.55], [0.1375, 0.55]]],
  },
  {
    // D (its counter is the tunnel aperture)
    x: 3.0,
    strokes: [[[0, 0], [0, 2], [0.35, 2], ...arc(0.35, 1, 0.6, 1, 90, -90, 18), [0.35, 0], [0, 0]]],
  },
  {
    // I
    x: 4.45,
    strokes: [[[0, 0], [0.3, 0], [0.15, 0], [0.15, 2], [0, 2], [0.3, 2]]],
  },
  {
    // X
    x: 5.25,
    strokes: [
      [[0, 0], [1, 2]],
      [[1, 0], [0, 2]],
    ],
  },
];
const CENTER_X = 3.47; // centre of the D counter -> world x = 0
const CONNECT_SAMPLES = 5;

function buildLetterTargets(sc) {
  const strokes = [];
  LETTERS.forEach((L) =>
    L.strokes.forEach((s) => strokes.push(s.map(([px, py]) => [(L.x + px - CENTER_X) * sc, (py - 1) * sc, 0])))
  );
  const lens = strokes.map((s) => {
    let len = 0;
    for (let i = 1; i < s.length; i++) len += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
    return len;
  });
  const totalLen = lens.reduce((a, b) => a + b, 0);
  const K = strokes.length;
  const budget = N - CONNECT_SAMPLES * (K - 1);
  const counts = lens.map((l) => Math.max(8, Math.round((budget * l) / totalLen)));
  const used = counts.slice(0, K - 1).reduce((a, b) => a + b, 0);
  counts[K - 1] = budget - used;

  const pts = new Float32Array(N * 3);
  const mask = new Float32Array(N);
  let w = 0;
  const put = (x, y, z, m) => {
    pts[w * 3] = x;
    pts[w * 3 + 1] = y;
    pts[w * 3 + 2] = z;
    mask[w] = m;
    w++;
  };

  strokes.forEach((s, k) => {
    // cumulative length
    const cum = [0];
    for (let i = 1; i < s.length; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
    const n = counts[k];
    let seg = 0;
    for (let i = 0; i < n; i++) {
      const target = (cum[cum.length - 1] * i) / (n - 1);
      while (seg < s.length - 2 && cum[seg + 1] < target) seg++;
      const segLen = cum[seg + 1] - cum[seg] || 1;
      const f = clamp01((target - cum[seg]) / segLen);
      put(s[seg][0] + (s[seg + 1][0] - s[seg][0]) * f, s[seg][1] + (s[seg + 1][1] - s[seg][1]) * f, 0, 1);
    }
    if (k < K - 1) {
      const a = s[s.length - 1];
      const b = strokes[k + 1][0];
      for (let j = 0; j < CONNECT_SAMPLES; j++) {
        const f = (j + 1) / (CONNECT_SAMPLES + 1);
        put(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 0, 0);
      }
    }
  });

  // soften the radius mask so strokes pinch off like liquid
  for (let pass = 0; pass < 3; pass++) {
    const copy = mask.slice();
    for (let i = 0; i < N; i++) {
      const a = copy[Math.max(0, i - 1)];
      const b = copy[i];
      const c = copy[Math.min(N - 1, i + 1)];
      mask[i] = a * 0.25 + b * 0.5 + c * 0.25;
    }
  }
  return { pts, mask };
}

function useRope() {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const verts = N * (RADIAL + 1);
    const pos = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
    const nor = new THREE.BufferAttribute(new Float32Array(verts * 3), 3);
    pos.setUsage(THREE.DynamicDrawUsage);
    nor.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", pos);
    g.setAttribute("normal", nor);
    const index = [];
    for (let i = 0; i < N - 1; i++) {
      for (let j = 0; j < RADIAL; j++) {
        const a = i * (RADIAL + 1) + j;
        const b = a + (RADIAL + 1);
        const c = a + 1;
        const d = b + 1;
        index.push(a, c, b, c, d, b);
      }
    }
    g.setIndex(index);
    return g;
  }, []);

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#f7f2e8",
      emissive: "#3b362c",
      emissiveIntensity: 0.4,
      metalness: 1,
      roughness: 0.16,
      iridescence: 1,
      iridescenceIOR: 1.55,
      iridescenceThicknessRange: [180, 620],
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.5,
    });
    // crisp Fresnel rim so the pearl rope never blends into the teal gradient
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `float rimF = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 2.6);
         outgoingLight += vec3(0.7, 1.0, 0.94) * rimF * 1.3;
         #include <opaque_fragment>`
      );
    };
    return m;
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  return { geometry, material };
}

function Starfield() {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const count = 1100;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.6 + Math.sqrt(Math.random()) * 10;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a) * r;
      arr[i * 3 + 2] = -45 + Math.random() * 56;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.05,
        color: "#d8fffb",
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

function Scene({ onPhase, onTunnelStart }) {
  const { camera, size } = useThree();
  const { geometry, material } = useRope();
  const aspect = size.width / Math.max(1, size.height);
  const visH = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(25));
  const visW = visH * aspect;
  const sc = Math.round(Math.min(1.55, (visW * 0.46) / CENTER_X) * 100) / 100;
  const ks = Math.min(0.75, (visW * 0.3) / 3);
  const target = useMemo(() => buildLetterTargets(sc), [sc]);
  const pts = useMemo(() => new Float32Array(N * 3), []);
  const radii = useMemo(() => new Float32Array(N), []);
  const st = useRef({ t: 0, tunnel: false, phase: -1 });
  const cam = useRef({ z: 10, fov: 50, roll: 0, ca: 0.0006, bloom: 0.55 });
  const caRef = useRef(null);
  const bloomRef = useRef(null);
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0004), []);

  useFrame((_, dtRaw) => {
    const s = st.current;
    const dt = Math.min(dtRaw, 0.05);
    s.t += dt;
    const t = s.t;

    const phase = t < T_WAVE0 ? 0 : t < T_LET0 ? 1 : 2;
    if (phase !== s.phase) {
      s.phase = phase;
      onPhase?.(phase);
    }

    const b1 = clamp01((t - T_WAVE0) / T_WAVE_D);
    const b2 = clamp01((t - T_LET0) / T_LET_D);
    const r0 = 0.085 * sc;
    const enterX = visW * 0.8 + 5;

    // knot rotation
    const ry = t * 0.9;
    const rx = 0.5 + Math.sin(t * 0.5) * 0.3;
    const cry = Math.cos(ry);
    const sry = Math.sin(ry);
    const crx = Math.cos(rx);
    const srx = Math.sin(rx);

    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const l1 = smooth(clamp01(b1 * (1 + STAGGER) - u * STAGGER));
      const l2 = smooth(clamp01(b2 * (1 + STAGGER) - u * STAGGER));

      // A: trefoil knot
      const a = u * Math.PI * 2 * 0.985;
      const kx = Math.sin(a) + 2 * Math.sin(2 * a);
      const ky = Math.cos(a) - 2 * Math.cos(2 * a);
      const kz = -Math.sin(3 * a);
      const x1 = kx * cry + kz * sry;
      const z1 = -kx * sry + kz * cry;
      const y1 = ky * crx - z1 * srx;
      const z2 = ky * srx + z1 * crx;
      const Ax = x1 * ks;
      const Ay = y1 * ks;
      const Az = z2 * ks;

      // B: flowing wave spanning the word
      const Bx = (u * 6.3 - CENTER_X) * sc;
      const By = Math.sin(u * 14 - t * 3.2) * 0.85 * sc;
      const Bz = Math.cos(u * 9 + t * 2.3) * 0.9 * sc;

      let x = Ax + (Bx - Ax) * l1;
      let y = Ay + (By - Ay) * l1;
      let z = Az + (Bz - Az) * l1;

      // C: letters
      x += (target.pts[i * 3] - x) * l2;
      y += (target.pts[i * 3 + 1] - y) * l2;
      z += (target.pts[i * 3 + 2] - z) * l2;

      // liquid wobble while in motion
      const wob = (1 - l2) * 0.14 * sc;
      x += Math.sin(u * 23 + t * 4.1) * wob;
      y += Math.cos(u * 19 + t * 3.7) * wob;

      // entrance: tail trails the head
      const e = easeOutCubic(clamp01((t - (1 - u) * 0.55) / 1.7));
      x += (1 - e) * enterX;
      z += (1 - e) * -2;

      pts[i * 3] = x;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = z;

      const maskR = 1 + (target.mask[i] - 1) * l2;
      const pulse = 1 + 0.05 * Math.sin(u * 60 - t * 4);
      const taper = Math.min(1, i / 8, (N - 1 - i) / 8);
      radii[i] = r0 * maskR * pulse * smooth(clamp01(taper)) * (0.35 + 0.65 * smooth(clamp01(e * 1.4)));
    }

    // tube with parallel-transport frames
    const pos = geometry.attributes.position.array;
    const nor = geometry.attributes.normal.array;
    let nx = 0;
    let ny = 1;
    let nz = 0;
    let tx = 1;
    let ty = 0;
    let tz = 0;
    for (let i = 0; i < N; i++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(N - 1, i + 1);
      let dx = pts[i1 * 3] - pts[i0 * 3];
      let dy = pts[i1 * 3 + 1] - pts[i0 * 3 + 1];
      let dz = pts[i1 * 3 + 2] - pts[i0 * 3 + 2];
      const dl = Math.hypot(dx, dy, dz);
      if (dl > 1e-6) {
        tx = dx / dl;
        ty = dy / dl;
        tz = dz / dl;
      }
      if (i === 0) {
        // seed normal
        let rx0 = 0;
        let ry0 = 1;
        let rz0 = 0;
        if (Math.abs(ty) > 0.9) {
          rx0 = 1;
          ry0 = 0;
        }
        const dd = rx0 * tx + ry0 * ty + rz0 * tz;
        nx = rx0 - dd * tx;
        ny = ry0 - dd * ty;
        nz = rz0 - dd * tz;
      } else {
        const dd = nx * tx + ny * ty + nz * tz;
        nx -= dd * tx;
        ny -= dd * ty;
        nz -= dd * tz;
      }
      let nl = Math.hypot(nx, ny, nz);
      if (nl < 1e-5) {
        nx = ty;
        ny = -tx;
        nz = 0;
        nl = Math.hypot(nx, ny, nz) || 1;
      }
      nx /= nl;
      ny /= nl;
      nz /= nl;
      // binormal = t × n
      const bx = ty * nz - tz * ny;
      const by = tz * nx - tx * nz;
      const bz = tx * ny - ty * nx;

      const px = pts[i * 3];
      const py = pts[i * 3 + 1];
      const pz = pts[i * 3 + 2];
      const rad = radii[i];
      for (let j = 0; j <= RADIAL; j++) {
        const ang = (j / RADIAL) * Math.PI * 2;
        const c = Math.cos(ang);
        const sn = Math.sin(ang);
        const ox = c * nx + sn * bx;
        const oy = c * ny + sn * by;
        const oz = c * nz + sn * bz;
        const k = (i * (RADIAL + 1) + j) * 3;
        pos[k] = px + ox * rad;
        pos[k + 1] = py + oy * rad;
        pos[k + 2] = pz + oz * rad;
        nor[k] = ox;
        nor[k + 1] = oy;
        nor[k + 2] = oz;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;

    // ---- tunnel zoom: camera dolly through the D aperture ----
    if (!s.tunnel && t >= T_TUNNEL) {
      s.tunnel = true;
      onTunnelStart?.();
      gsap.to(cam.current, { z: -15, duration: 1.9, ease: "power3.in" });
      gsap.to(cam.current, { fov: 112, duration: 1.9, ease: "power2.in" });
      gsap.to(cam.current, { roll: 0.5, duration: 1.9, ease: "power2.in" });
      gsap.to(cam.current, { ca: 0.014, duration: 1.7, ease: "power2.in" });
      gsap.to(cam.current, { bloom: 2.4, duration: 1.9, ease: "power2.in" });
    }
    const c = cam.current;
    camera.position.set(0, 0, c.z);
    camera.rotation.z = c.roll;
    if (Math.abs(camera.fov - c.fov) > 0.01) {
      camera.fov = c.fov;
      camera.updateProjectionMatrix();
    }
    if (caRef.current) caRef.current.offset.set(c.ca, c.ca * 0.7);
    if (bloomRef.current) bloomRef.current.intensity = c.bloom;
  });

  useEffect(() => {
    const c = cam.current;
    return () => gsap.killTweensOf(c);
  }, []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={7} color="#ffffff" position={[0, 6, -4]} scale={[14, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={5} color="#fff3dc" position={[-8, 1, 2]} scale={[2, 9, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={5} color="#d6fff6" position={[8, -1, 3]} scale={[2, 9, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={4} color="#ffffff" position={[0, 0, 8]} scale={7} />
        <Lightformer form="rect" intensity={2.2} color="#9fe9ff" position={[0, -6, 0]} scale={[14, 2, 1]} rotation-x={-Math.PI / 2} />
      </Environment>
      <Starfield />
      <mesh geometry={geometry} material={material} frustumCulled={false} />
      <EffectComposer multisampling={4}>
        <Bloom ref={bloomRef} intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.25} mipmapBlur />
        <ChromaticAberration
          ref={caRef}
          offset={caOffset}
          radialModulation={false}
          modulationOffset={0}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

const PHASE_LABELS = [
  "01 — INGESTING RAW LOGIC",
  "02 — UNCOILING THE SIGNAL",
  "03 — COMPILING  RADIX // 01  (PILOT EDITION)",
];

export default function IntroSequence({ onReveal, onDone }) {
  const rootRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const flags = useRef({ revealed: false, finished: false, skipped: false });

  const reveal = useCallback(() => {
    if (flags.current.revealed) return;
    flags.current.revealed = true;
    onReveal?.();
  }, [onReveal]);

  const finish = useCallback(() => {
    if (flags.current.finished) return;
    flags.current.finished = true;
    reveal();
    onDone?.();
  }, [reveal, onDone]);

  const handleTunnelStart = useCallback(() => {
    if (flags.current.skipped) return;
    gsap.delayedCall(1.15, reveal);
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 0.9,
      delay: 1.1,
      ease: "power2.inOut",
      onComplete: finish,
    });
  }, [reveal, finish]);

  const skip = useCallback(() => {
    if (flags.current.skipped || flags.current.finished) return;
    flags.current.skipped = true;
    gsap.killTweensOf(rootRef.current);
    reveal();
    gsap.to(rootRef.current, { opacity: 0, duration: 0.7, ease: "power2.out", onComplete: finish });
  }, [reveal, finish]);

  useEffect(() => {
    const el = rootRef.current;
    const onKey = (e) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      gsap.killTweensOf(el);
    };
  }, [skip]);

  return (
    <div ref={rootRef} className="fixed inset-0 overflow-hidden" style={{ zIndex: 5000, background: "#031926" }}>
      {/* bluish-greenish moving ShaderGradient (teal / cyan / emerald / aquamarine) */}
      <div
        className="mesh-fallback"
        style={{ "--c0": "#031926", "--c1": "#00b4d8", "--c2": "#007f5f", "--c3": "#72efdd" }}
        aria-hidden="true"
      />
      <SafeBoundary>
        <div className="absolute inset-0" aria-hidden="true">
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
              uSpeed={0.28}
              uStrength={3.6}
              uDensity={1.3}
              uFrequency={5.5}
              uAmplitude={1}
              positionX={-1.4}
              positionY={0}
              positionZ={0}
              rotationX={0}
              rotationY={10}
              rotationZ={50}
              color1="#00b4d8"
              color2="#007f5f"
              color3="#031926"
              reflection={0.1}
              wireframe={false}
              cAzimuthAngle={180}
              cPolarAngle={90}
              cDistance={3.6}
              cameraZoom={1}
              lightType="3d"
              brightness={1.15}
              envPreset="city"
              grain="off"
            />
          </ShaderGradientCanvas>
        </div>
      </SafeBoundary>
      {/* soft aquamarine highlight bloom */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 45% at 70% 20%, rgba(114,239,221,0.28), transparent 70%), radial-gradient(50% 40% at 15% 85%, rgba(114,239,221,0.18), transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      <SafeBoundary onError={() => window.setTimeout(skip, 0)}>
        <Canvas
          style={{ position: "absolute", inset: 0 }}
          camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 140 }}
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Scene onPhase={setPhase} onTunnelStart={handleTunnelStart} />
        </Canvas>
      </SafeBoundary>

      {/* caption */}
      <div className="pointer-events-none absolute inset-x-0 top-8 flex flex-col items-center gap-2 px-4 text-center">
        <div
          key={phase}
          className="text-[10px] tracking-[0.34em] sm:text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "rgba(235,255,252,0.9)", animation: "fade-up .6s var(--ease-spring) both" }}
        >
          {PHASE_LABELS[phase]}
        </div>
        <div className="h-px w-40 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
          <div
            className="h-full"
            style={{ width: `${((phase + 1) / 3) * 100}%`, background: "#72efdd", transition: "width 1s var(--ease-spring)" }}
          />
        </div>
      </div>

      {/* skip pill */}
      <div className="absolute" style={{ left: 24, bottom: 24, zIndex: 2 }}>
        <LiquidGlassSurface
          as="button"
          type="button"
          onClick={skip}
          radius={999}
          blur={14}
          refraction={0.6}
          dispersion={false}
          bezel={14}
          className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ color: "#eafffb", padding: 0, display: "block" }}
        >
          <span
            className="flex items-center gap-2 px-5 py-3 text-[11px] tracking-[0.28em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SKIP INTRO <span aria-hidden="true">→</span>
          </span>
        </LiquidGlassSurface>
      </div>
    </div>
  );
}
