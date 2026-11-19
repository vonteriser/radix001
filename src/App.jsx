import { useCallback, useMemo, useRef, useState } from "react";
import { HashRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { TransitionContext } from "./context/TransitionContext";
import AppleGradientBackground from "./components/AppleGradientBackground";
import IntroSequence from "./components/IntroSequence";
import Navbar from "./components/Navbar";
import ThemeToggle from "./components/ThemeToggle";
import Home from "./pages/Home";
import Connect from "./pages/Connect";
import Events from "./pages/Events";
import Timeline from "./pages/Timeline";
import Team from "./pages/Team";
import Register from "./pages/Register";
import NotFound404 from "./pages/NotFound404";

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();

  // The cinematic intro gates the Home screen. Deep links skip it.
  const [introActive, setIntroActive] = useState(() => location.pathname === "/");
  const [revealed, setRevealed] = useState(() => location.pathname !== "/");
  const [burst, setBurst] = useState(null);
  const timer = useRef(0);

  const burstTo = useCallback(
    (x, y, color, path) => {
      window.clearTimeout(timer.current);
      setBurst({ id: Date.now(), x, y, color });
      timer.current = window.setTimeout(() => navigate(path), 520);
    },
    [navigate]
  );

  const ctx = useMemo(() => ({ revealed, burstTo }), [revealed, burstTo]);
  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleDone = useCallback(() => setIntroActive(false), []);

  const radius = typeof window !== "undefined" ? Math.hypot(window.innerWidth, window.innerHeight) : 2400;

  return (
    <TransitionContext.Provider value={ctx}>
      <div className="relative min-h-dvh" style={{ background: "var(--page-bg)" }}>
        {revealed && <AppleGradientBackground pathname={location.pathname} />}

        <Navbar />

        <div key={location.pathname} style={{ animation: "page-in .7s ease backwards" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/events" element={<Events />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/team" element={<Team />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound404 />} />
          </Routes>
        </div>

        {introActive && <IntroSequence onReveal={handleReveal} onDone={handleDone} />}

        {/* radial expansion transition */}
        {burst && (
          <motion.div
            key={burst.id}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0"
            style={{
              zIndex: 4000,
              background: `radial-gradient(circle at ${burst.x}px ${burst.y}px, rgba(255,255,255,0.65), ${burst.color}d0 38%, ${burst.color}88 100%)`,
              backdropFilter: "blur(22px) saturate(1.7)",
              WebkitBackdropFilter: "blur(22px) saturate(1.7)",
            }}
            initial={{ clipPath: `circle(0px at ${burst.x}px ${burst.y}px)`, opacity: 1 }}
            animate={{
              clipPath: [
                `circle(0px at ${burst.x}px ${burst.y}px)`,
                `circle(${radius}px at ${burst.x}px ${burst.y}px)`,
                `circle(${radius}px at ${burst.x}px ${burst.y}px)`,
              ],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 1.35, times: [0, 0.4, 1], ease: "easeInOut" }}
            onAnimationComplete={() => setBurst(null)}
          />
        )}

        <ThemeToggle />
      </div>
    </TransitionContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </ThemeProvider>
  );
}
