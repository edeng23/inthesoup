"use client"

/**
 * Full-viewport film grain. Rendered from an inline SVG turbulence so it costs
 * no network request, and stepped through a few frames so it shimmers like
 * projected 16mm rather than sitting still like a texture.
 */
export default function Grain({
  opacity = 0.16,
  blend = "overlay",
  animate = true,
  scale = 220,
}: {
  opacity?: number
  blend?: "overlay" | "soft-light" | "multiply" | "screen"
  animate?: boolean
  scale?: number
}) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${scale}' height='${scale}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>`

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-[100] ${animate ? "grain-shift" : ""}`}
      style={{
        opacity,
        mixBlendMode: blend,
        backgroundImage: `url("data:image/svg+xml;utf8,${svg.replace(/#/g, "%23")}")`,
        backgroundSize: `${scale}px ${scale}px`,
      }}
    />
  )
}
