import { format, parseISO } from "date-fns"
import { monthLabel, type Screening } from "@/lib/screenings"

/**
 * Draws the month's programme as a printable poster on a canvas.
 *
 * Canvas rather than a DOM screenshot: it uses the page's already-loaded
 * webfonts directly and exports at print resolution. Film artwork comes
 * through /api/poster-image so every image is same-origin — several of the
 * hosts we link to send no CORS headers, and drawing one of those straight
 * onto the canvas would taint it and make the export fail.
 *
 * The sheet is A4 landscape: 1754 × 1240 at 150dpi, rendered at 2× for a
 * true 300dpi print.
 */

export const POSTER_W = 1754
export const POSTER_H = 1240

const GOLD = "#E7C27D"

/* -------------------------------------------------------------------------- */
/* helpers                                                                     */

/** next/font generates hashed family names; read them off the document. */
function family(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim()
  return value ? `${value}, ${fallback}` : fallback
}

const displayFont = () => family("--font-display", "Impact, sans-serif")
const serifFont = () => family("--font-serif", "Georgia, serif")

const cache = new Map<string, HTMLImageElement | null>()

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not load ${src}`))
    img.src = src
  })
}

/** Film artwork, routed through our own origin and remembered between renders. */
async function loadPoster(url: string): Promise<HTMLImageElement | null> {
  if (cache.has(url)) return cache.get(url) ?? null
  try {
    const img = await loadImage(`/api/poster-image?url=${encodeURIComponent(url)}`)
    cache.set(url, img)
    return img
  } catch {
    cache.set(url, null)
    return null
  }
}

/** Shrinks `size` until `text` fits `maxWidth`. */
function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
  size: number,
  min = 12,
  spacing = 0
) {
  let s = size
  while (s > min) {
    ctx.font = `${s}px ${font}`
    if (measure(ctx, text, spacing) <= maxWidth) break
    s -= 1
  }
  ctx.font = `${s}px ${font}`
  return s
}

function measure(ctx: CanvasRenderingContext2D, text: string, spacing = 0) {
  return ctx.measureText(text).width + spacing * Math.max(0, text.length - 1)
}

/**
 * Draws text with real letter spacing. `ctx.letterSpacing` isn't available
 * everywhere, so the glyphs are placed one at a time.
 */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  { spacing = 0 } = {}
) {
  const width = measure(ctx, text, spacing)
  let cursor = x - width / 2
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + spacing
  }
}

/** Greedy word wrap at the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

/** `object-fit: cover` for canvas. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/** Stands in for artwork that wouldn't load, so a plate is never just a hole. */
function fallbackPlate(
  ctx: CanvasRenderingContext2D,
  film: Screening,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = "#141011"
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = `${GOLD}cc`
  const size = Math.max(14, Math.round(w * 0.1))
  ctx.font = `${size}px ${displayFont()}`
  const lines = wrap(ctx, film.title.toUpperCase(), w - 24)
  let ly = y + h / 2 - ((lines.length - 1) * size * 1.15) / 2
  for (const line of lines) {
    drawText(ctx, line, x + w / 2, ly)
    ly += size * 1.15
  }
}

/** Even row of poster plates, centred in the given area. */
function posterRow(areaX: number, areaW: number, count: number, maxW: number, gap: number) {
  const w = Math.max(80, Math.min(maxW, (areaW - gap * (count - 1)) / Math.max(count, 1)))
  const total = w * count + gap * (count - 1)
  return { w, h: w * 1.5, x0: areaX + (areaW - total) / 2, gap }
}

/**
 * Draws one of the hosts, dissolving the bottom of the crop so the cut-out
 * doesn't end in a hard rectangle — the same treatment as on the site.
 *
 * The fade is cut out of the image's own alpha on an offscreen canvas rather
 * than painted over in the background colour, which would leave a visible
 * patch anywhere the background isn't perfectly flat.
 */
function drawHost(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  bottom: number,
  width: number
) {
  const height = (img.height / img.width) * width
  const top = bottom - height

  const supersample = 2
  const off = document.createElement("canvas")
  off.width = Math.ceil(width * supersample)
  off.height = Math.ceil(height * supersample)
  const o = off.getContext("2d")
  if (!o) return

  o.drawImage(img, 0, 0, off.width, off.height)
  o.globalCompositeOperation = "destination-out"
  const fade = o.createLinearGradient(0, off.height * 0.58, 0, off.height)
  fade.addColorStop(0, "rgba(0,0,0,0)")
  fade.addColorStop(1, "rgba(0,0,0,1)")
  o.fillStyle = fade
  o.fillRect(0, off.height * 0.58, off.width, off.height * 0.42)

  ctx.drawImage(off, x, top, width, height)
}

const dayLine = (film: Screening) =>
  format(parseISO(film.date), "EEE d MMMM").toUpperCase()

/* -------------------------------------------------------------------------- */

/** Renders the month's sheet into `canvas` at 300dpi A4 landscape. */
export async function renderPoster(
  canvas: HTMLCanvasElement,
  monthKey: string,
  films: Screening[]
) {
  const scale = 2
  canvas.width = POSTER_W * scale
  canvas.height = POSTER_H * scale

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("no 2d context")
  ctx.scale(scale, scale)
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"

  // The canvas only has a font once the document has actually loaded it.
  if (document.fonts?.ready) await document.fonts.ready

  const [eden, noga, soup, ...art] = await Promise.all([
    loadImage("/eden.png"),
    loadImage("/noga.png"),
    loadImage("/soup.png"),
    ...films.map((f) => loadPoster(f.posterUrl)),
  ])

  ctx.fillStyle = "#080607"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const halo = ctx.createRadialGradient(POSTER_W / 2, 240, 30, POSTER_W / 2, 420, 1100)
  halo.addColorStop(0, "rgba(231,194,125,0.20)")
  halo.addColorStop(0.5, "rgba(160,40,40,0.10)")
  halo.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const cx = POSTER_W / 2

  const hostW = 150
  drawHost(ctx, eden, 46, POSTER_H - 22, hostW)
  drawHost(ctx, noga, POSTER_W - hostW - 46, POSTER_H - 22, hostW)

  const soupW = 104
  ctx.save()
  ctx.shadowColor = "rgba(231,194,125,0.55)"
  ctx.shadowBlur = 44
  ctx.drawImage(soup, cx - soupW / 2, 74, soupW, soupW)
  ctx.restore()

  // Tube-lit title: a wide soft glow, then a hot core.
  const title = "IN THE SOUP"
  fit(ctx, title, POSTER_W - 760, displayFont(), 122, 50, 5)
  ctx.save()
  ctx.shadowColor = "rgba(255,196,120,0.9)"
  ctx.fillStyle = "rgba(255,226,178,0.35)"
  ctx.shadowBlur = 80
  drawText(ctx, title, cx, 296, { spacing: 5 })
  ctx.shadowBlur = 42
  ctx.fillStyle = "#FFF3DC"
  drawText(ctx, title, cx, 296, { spacing: 5 })
  ctx.restore()

  ctx.fillStyle = GOLD
  ctx.font = `32px ${displayFont()}`
  ctx.save()
  ctx.shadowColor = "rgba(231,194,125,0.7)"
  ctx.shadowBlur = 24
  drawText(ctx, monthLabel(monthKey).toUpperCase(), cx, 348, { spacing: 15 })
  ctx.restore()

  const { w, h, x0, gap } = posterRow(160, POSTER_W - 320, films.length, 330, 40)
  const top = 400
  films.forEach((film, i) => {
    const x = x0 + i * (w + gap)
    const image = art[i]
    ctx.save()
    ctx.shadowColor = "rgba(231,194,125,0.28)"
    ctx.shadowBlur = 40
    ctx.fillStyle = "#000"
    ctx.fillRect(x, top, w, h)
    ctx.restore()
    if (image) drawCover(ctx, image, x, top, w, h)
    else fallbackPlate(ctx, film, x, top, w, h)

    ctx.strokeStyle = "rgba(231,194,125,0.45)"
    ctx.lineWidth = 1.5
    ctx.strokeRect(x + 0.75, top + 0.75, w - 1.5, h - 1.5)

    ctx.fillStyle = "rgba(231,194,125,0.75)"
    ctx.font = `19px ${displayFont()}`
    drawText(ctx, dayLine(film), x + w / 2, top + h + 38, { spacing: 7 })

    ctx.save()
    ctx.fillStyle = "#F7F1E6"
    ctx.shadowColor = "rgba(255,220,170,0.35)"
    ctx.shadowBlur = 22
    fit(ctx, film.title.toUpperCase(), w, displayFont(), 32, 13, 1)
    drawText(ctx, film.title.toUpperCase(), x + w / 2, top + h + 78, { spacing: 1 })
    ctx.restore()

    ctx.fillStyle = "rgba(246,239,223,0.45)"
    ctx.font = `italic 22px ${serifFont()}`
    drawText(ctx, film.year, x + w / 2, top + h + 108)
  })

  ctx.strokeStyle = "rgba(231,194,125,0.22)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(420, POSTER_H - 150)
  ctx.lineTo(POSTER_W - 420, POSTER_H - 150)
  ctx.stroke()

  ctx.fillStyle = "#EBD4A8"
  ctx.font = `italic 32px ${serifFont()}`
  drawText(ctx, "Omelettes at eight · Screening at nine", cx, POSTER_H - 102)
  ctx.fillStyle = "rgba(201,169,127,0.72)"
  ctx.font = `italic 26px ${serifFont()}`
  drawText(ctx, "Location announced on the day", cx, POSTER_H - 62)
}

export function posterFilename(monthKey: string) {
  return `in-the-soup-${monthKey}.jpg`
}
