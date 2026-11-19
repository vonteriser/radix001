// Monumental refractive "glass lettering". Colour fringing, specular highlight
// and tilt are driven by CSS variables (--mx --my --nx --ny) published by the
// parent <LiquidGlassSurface>, so the type reacts to the cursor in real time.
export default function GlassWord({ children, className = "", style, mono = false, as: Tag = "span" }) {
  const text = typeof children === "string" ? children : "";
  return (
    <Tag
      className={`gt-word ${className}`}
      data-text={text}
      style={{
        fontFamily: mono ? "var(--font-mono)" : undefined,
        letterSpacing: mono ? "0.04em" : undefined,
        ...style,
      }}
    >
      <span className="gt-fill">{children}</span>
    </Tag>
  );
}
