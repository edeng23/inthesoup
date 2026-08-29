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

export type PosterStyleId = "marquee" | "playbill" | "ticket" | "neon"

export const POSTER_STYLES: {
  id: PosterStyleId
  name: string
  blurb: string
}[] = [
  { id: "marquee", name: "Marquee", blurb: "The sign itself — brass, bulbs, velvet" },
  { id: "playbill", name: "Playbill", blurb: "Letterpress handbill on cream stock" },
  { id: "ticket", name: "Ticket", blurb: "One giant admission stub" },
  { id: "neon", name: "Neon", blurb: "Dark and glowing, modern house style" },
]

const GOLD = "#E7C27D"
const GOLD_DIM = "#9C7C43"
const CREAM = "#F6EFDF"

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
  { spacing = 0, align = "center" as "center" | "left" | "right" } = {}
) {
  const width = measure(ctx, text, spacing)
  let cursor = align === "center" ? x - width / 2 : align === "right" ? x - width : x
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + spacing
  }
  return width
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
  h: number,
  bg: string,
  fg: string
) {
  ctx.fillStyle = bg
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = fg
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
 * than painted over in the background colour, so it works over a gradient,
 * a photo or paper stock without leaving a visible patch.
 */
function drawHost(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  bottom: number,
  width: number,
  filter?: string
) {
  const height = (img.height / img.width) * width
  const top = bottom - height

  const supersample = 2
  const off = document.createElement("canvas")
  off.width = Math.ceil(width * supersample)
  off.height = Math.ceil(height * supersample)
  const o = off.getContext("2d")
  if (!o) return

  if (filter) o.filter = filter
  o.drawImage(img, 0, 0, off.width, off.height)
  o.filter = "none"

  o.globalCompositeOperation = "destination-out"
  const fade = o.createLinearGradient(0, off.height * 0.58, 0, off.height)
  fade.addColorStop(0, "rgba(0,0,0,0)")
  fade.addColorStop(1, "rgba(0,0,0,1)")
  o.fillStyle = fade
  o.fillRect(0, off.height * 0.58, off.width, off.height * 0.42)

  ctx.drawImage(off, x, top, width, height)
}

/** A ring of lit bulbs around a rectangle. */
function bulbRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  across: number,
  down: number,
  radius: number
) {
  const dots: [number, number][] = []
  for (let i = 0; i < across; i++) {
    const t = i / (across - 1)
    dots.push([x + t * w, y], [x + t * w, y + h])
  }
  for (let i = 1; i < down; i++) {
    const t = i / down
    dots.push([x, y + t * h], [x + w, y + t * h])
  }
  for (const [cx, cy] of dots) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 4)
    glow.addColorStop(0, "rgba(231,194,125,0.5)")
    glow.addColorStop(1, "rgba(231,194,125,0)")
    ctx.fillStyle = glow
    ctx.fillRect(cx - radius * 4, cy - radius * 4, radius * 8, radius * 8)

    const bulb = ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.35,
      0,
      cx,
      cy,
      radius
    )
    bulb.addColorStop(0, "#FFF6DE")
    bulb.addColorStop(0.55, GOLD)
    bulb.addColorStop(1, "#B98F45")
    ctx.fillStyle = bulb
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Paper speckle, so flat stock doesn't read as a screen fill. */
function speckle(ctx: CanvasRenderingContext2D, count: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = Math.random() * 0.06
    ctx.fillRect(Math.random() * POSTER_W, Math.random() * POSTER_H, 1.5, 1.5)
  }
  ctx.restore()
}

type Ctx = {
  ctx: CanvasRenderingContext2D
  films: Screening[]
  art: (HTMLImageElement | null)[]
  monthKey: string
  eden: HTMLImageElement
  noga: HTMLImageElement
  soup: HTMLImageElement
}

const dayLine = (film: Screening) =>
  format(parseISO(film.date), "EEE d MMMM").toUpperCase()

/* -------------------------------------------------------------------------- */
/* styles                                                                      */

function drawMarquee({ ctx, films, art, monthKey, eden, noga, soup }: Ctx) {
  const bg = ctx.createRadialGradient(POSTER_W / 2, -160, 40, POSTER_W / 2, POSTER_H, POSTER_W)
  bg.addColorStop(0, "#2A0F10")
  bg.addColorStop(0.55, "#0D0707")
  bg.addColorStop(1, "#060303")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const m = 34
  const brass = ctx.createLinearGradient(m, m, POSTER_W - m, POSTER_H - m)
  brass.addColorStop(0, "#D9BB84")
  brass.addColorStop(0.2, "#9C7C43")
  brass.addColorStop(0.38, "#7A5C2C")
  brass.addColorStop(0.5, "#C9A263")
  brass.addColorStop(0.68, "#86673A")
  brass.addColorStop(0.86, "#B59558")
  brass.addColorStop(1, "#6B5029")
  ctx.fillStyle = brass
  ctx.fillRect(m, m, POSTER_W - m * 2, POSTER_H - m * 2)

  const b = 15
  const face = ctx.createRadialGradient(
    POSTER_W / 2,
    m + b,
    40,
    POSTER_W / 2,
    POSTER_H / 2,
    POSTER_W * 0.7
  )
  face.addColorStop(0, "#1D0D0E")
  face.addColorStop(0.52, "#120809")
  face.addColorStop(1, "#090404")
  ctx.fillStyle = face
  ctx.fillRect(m + b, m + b, POSTER_W - (m + b) * 2, POSTER_H - (m + b) * 2)

  const inset = m + b + 26
  bulbRing(ctx, inset, inset, POSTER_W - inset * 2, POSTER_H - inset * 2, 15, 5, 8)

  // Left column: the sign
  const lx = 300
  const soupW = 120
  ctx.drawImage(soup, lx - soupW / 2, 370, soupW, soupW)

  ctx.fillStyle = "#FFF4DE"
  ctx.shadowColor = "rgba(231,194,125,0.6)"
  ctx.shadowBlur = 34
  fit(ctx, "IN THE SOUP", 400, displayFont(), 96, 40, 3)
  drawText(ctx, "IN THE SOUP", lx, 590, { spacing: 3 })
  ctx.shadowBlur = 0

  ctx.strokeStyle = GOLD_DIM
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(lx - 170, 628)
  ctx.lineTo(lx + 170, 628)
  ctx.stroke()

  ctx.fillStyle = GOLD
  ctx.font = `34px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey).toUpperCase(), lx, 682, { spacing: 10 })

  ctx.fillStyle = "#EBD4A8"
  ctx.font = `italic 30px ${serifFont()}`
  drawText(ctx, "Omelettes at eight", lx, 756)
  drawText(ctx, "Screening at nine", lx, 796)
  ctx.fillStyle = "#C9A97Fbb"
  ctx.font = `italic 25px ${serifFont()}`
  drawText(ctx, "Location announced on the day", lx, 844)

  // Hosts anchored to the sheet's bottom corners, balancing the composition.
  const hostW = 170
  drawHost(ctx, eden, 92, POSTER_H - m - b - 12, hostW)
  drawHost(ctx, noga, POSTER_W - m - b - hostW - 12, POSTER_H - m - b - 12, hostW)

  // Right: the artwork
  const { w, h, x0, gap } = posterRow(540, 1120, films.length, 360, 34)
  const top = 120 + (1000 - (h + 108)) / 2
  films.forEach((film, i) => {
    const x = x0 + i * (w + gap)
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.75)"
    ctx.shadowBlur = 34
    ctx.shadowOffsetY = 14
    ctx.fillStyle = "#000"
    ctx.fillRect(x, top, w, h)
    ctx.restore()

    const image = art[i]
    if (image) drawCover(ctx, image, x, top, w, h)
    else fallbackPlate(ctx, film, x, top, w, h, "#1A0D0E", `${GOLD}cc`)

    ctx.strokeStyle = `${GOLD}88`
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, top + 1, w - 2, h - 2)

    ctx.fillStyle = CREAM
    const size = fit(ctx, film.title.toUpperCase(), w, displayFont(), 32, 13, 1)
    drawText(ctx, film.title.toUpperCase(), x + w / 2, top + h + 42, { spacing: 1 })

    ctx.fillStyle = `${GOLD}cc`
    ctx.font = `20px ${displayFont()}`
    drawText(ctx, dayLine(film), x + w / 2, top + h + 72, { spacing: 5 })

    ctx.fillStyle = "#C9A97F99"
    ctx.font = `italic 22px ${serifFont()}`
    drawText(ctx, film.year, x + w / 2, top + h + 100)
    void size
  })
}

function drawPlaybill({ ctx, films, art, monthKey, eden, noga }: Ctx) {
  ctx.fillStyle = "#EFE7D6"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  speckle(ctx, 6000, "#4A3A22")

  const ink = "#16120D"
  const red = "#9A2B1C"
  const cx = POSTER_W / 2

  const grey = "grayscale(1) contrast(1.15)"
  const hostW = 122
  drawHost(ctx, eden, 74, POSTER_H - 62, hostW, grey)
  drawHost(ctx, noga, POSTER_W - hostW - 74, POSTER_H - 62, hostW, grey)

  ctx.strokeStyle = ink
  ctx.lineWidth = 5
  ctx.strokeRect(30, 30, POSTER_W - 60, POSTER_H - 60)
  ctx.lineWidth = 1.5
  ctx.strokeRect(44, 44, POSTER_W - 88, POSTER_H - 88)

  ctx.fillStyle = ink
  ctx.font = `26px ${displayFont()}`
  drawText(ctx, "A FILM CLUB · EST. MMXXIV", cx, 108, { spacing: 9 })

  fit(ctx, "IN THE SOUP", POSTER_W - 620, displayFont(), 124, 60, 2)
  drawText(ctx, "IN THE SOUP", cx, 214, { spacing: 2 })

  ctx.fillStyle = red
  ctx.font = `22px ${displayFont()}`
  drawText(ctx, "✦   PROGRAMME FOR   ✦", cx, 256, { spacing: 7 })
  ctx.fillStyle = ink
  ctx.font = `46px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey).toUpperCase(), cx, 312, { spacing: 8 })

  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(220, 344)
  ctx.lineTo(POSTER_W - 220, 344)
  ctx.stroke()

  const { w, h, x0, gap } = posterRow(150, POSTER_W - 300, films.length, 360, 44)
  const top = 380
  films.forEach((film, i) => {
    const x = x0 + i * (w + gap)
    const image = art[i]
    ctx.save()
    ctx.filter = "grayscale(1) contrast(1.12) brightness(1.02)"
    if (image) drawCover(ctx, image, x, top, w, h)
    else fallbackPlate(ctx, film, x, top, w, h, "#D9D0BD", ink)
    ctx.restore()

    ctx.strokeStyle = ink
    ctx.lineWidth = 2.5
    ctx.strokeRect(x + 1, top + 1, w - 2, h - 2)

    ctx.fillStyle = red
    ctx.font = `20px ${displayFont()}`
    drawText(ctx, dayLine(film), x + w / 2, top + h + 40, { spacing: 6 })

    ctx.fillStyle = ink
    fit(ctx, film.title.toUpperCase(), w, displayFont(), 34, 13, 1)
    drawText(ctx, film.title.toUpperCase(), x + w / 2, top + h + 82, { spacing: 1 })

    ctx.font = `italic 24px ${serifFont()}`
    drawText(ctx, film.year, x + w / 2, top + h + 114)
  })

  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(220, POSTER_H - 168)
  ctx.lineTo(POSTER_W - 220, POSTER_H - 168)
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.font = `30px ${displayFont()}`
  drawText(ctx, "OMELETTES 20:00   ·   SCREENING 21:00", cx, POSTER_H - 118, {
    spacing: 6,
  })
  ctx.font = `italic 26px ${serifFont()}`
  drawText(ctx, "Location announced on the day", cx, POSTER_H - 76)
}

function drawTicket({ ctx, films, art, monthKey, eden, noga }: Ctx) {
  ctx.fillStyle = "#0D0707"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const m = 28
  const stock = ctx.createLinearGradient(m, m, POSTER_W - m, POSTER_H - m)
  stock.addColorStop(0, "#F6E7C8")
  stock.addColorStop(0.45, "#EFDCB6")
  stock.addColorStop(1, "#E4CDA1")
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.6)"
  ctx.shadowBlur = 50
  ctx.shadowOffsetY = 16
  ctx.fillStyle = stock
  roundRect(ctx, m, m, POSTER_W - m * 2, POSTER_H - m * 2, 16)
  ctx.fill()
  ctx.restore()

  const ink = "#2A1408"
  const sub = "#7A4A24"
  const perf = POSTER_W - 430
  const bodyCx = (m + perf) / 2
  const stubCx = (perf + POSTER_W - m) / 2

  // Perforation, punched top and bottom
  ctx.fillStyle = "#0D0707"
  ctx.beginPath()
  ctx.arc(perf, m, 24, 0, Math.PI * 2)
  ctx.arc(perf, POSTER_H - m, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "rgba(42,20,8,0.45)"
  ctx.lineWidth = 3
  ctx.setLineDash([12, 12])
  ctx.beginPath()
  ctx.moveTo(perf, m + 38)
  ctx.lineTo(perf, POSTER_H - m - 38)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = sub
  ctx.font = `28px ${displayFont()}`
  drawText(ctx, "ADMIT ONE", m + 62, 108, { spacing: 10, align: "left" })
  drawText(ctx, monthLabel(monthKey, "MM / yyyy"), perf - 46, 108, {
    spacing: 10,
    align: "right",
  })

  ctx.fillStyle = ink
  fit(ctx, "IN THE SOUP", 820, displayFont(), 112, 50, 2)
  drawText(ctx, "IN THE SOUP", bodyCx, 214, { spacing: 2 })

  ctx.fillStyle = sub
  ctx.font = `36px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey).toUpperCase(), bodyCx, 264, { spacing: 11 })

  ctx.strokeStyle = "rgba(42,20,8,0.25)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(m + 62, 300)
  ctx.lineTo(perf - 46, 300)
  ctx.stroke()

  const { w, h, x0, gap } = posterRow(m + 62, perf - m - 108, films.length, 300, 34)
  const top = 330 + (850 - (h + 110)) / 2
  films.forEach((film, i) => {
    const x = x0 + i * (w + gap)
    const image = art[i]
    ctx.save()
    ctx.shadowColor = "rgba(42,20,8,0.45)"
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 10
    ctx.fillStyle = "#00000022"
    ctx.fillRect(x, top, w, h)
    ctx.restore()
    if (image) drawCover(ctx, image, x, top, w, h)
    else fallbackPlate(ctx, film, x, top, w, h, "#D9C6A0", ink)

    ctx.strokeStyle = "rgba(42,20,8,0.55)"
    ctx.lineWidth = 2
    ctx.strokeRect(x + 1, top + 1, w - 2, h - 2)

    ctx.fillStyle = sub
    ctx.font = `18px ${displayFont()}`
    drawText(ctx, `№ ${String(film.no).padStart(3, "0")}`, x + w / 2, top + h + 34, {
      spacing: 5,
    })

    ctx.fillStyle = ink
    fit(ctx, film.title.toUpperCase(), w, displayFont(), 30, 12, 1)
    drawText(ctx, film.title.toUpperCase(), x + w / 2, top + h + 72, { spacing: 1 })

    ctx.fillStyle = sub
    ctx.font = `19px ${displayFont()}`
    drawText(ctx, `${dayLine(film)} · ${film.year}`, x + w / 2, top + h + 100, {
      spacing: 3,
    })
  })

  // Stub
  ctx.fillStyle = sub
  ctx.font = `24px ${displayFont()}`
  drawText(ctx, "DOORS", stubCx, 190, { spacing: 8 })
  ctx.fillStyle = ink
  ctx.font = `62px ${displayFont()}`
  drawText(ctx, "20:00", stubCx, 254, { spacing: 3 })

  ctx.fillStyle = sub
  ctx.font = `24px ${displayFont()}`
  drawText(ctx, "FEATURE", stubCx, 330, { spacing: 8 })
  ctx.fillStyle = ink
  ctx.font = `62px ${displayFont()}`
  drawText(ctx, "21:00", stubCx, 394, { spacing: 3 })

  ctx.fillStyle = sub
  ctx.font = `24px ${displayFont()}`
  drawText(ctx, "PLACE", stubCx, 470, { spacing: 8 })
  ctx.fillStyle = ink
  ctx.font = `32px ${displayFont()}`
  drawText(ctx, "ON THE DAY", stubCx, 516, { spacing: 3 })

  ctx.save()
  ctx.translate(stubCx, 630)
  ctx.rotate((-13 * Math.PI) / 180)
  ctx.globalAlpha = 0.26
  ctx.strokeStyle = "#8E2B1B"
  ctx.fillStyle = "#8E2B1B"
  ctx.lineWidth = 5
  roundRect(ctx, -104, -52, 208, 104, 8)
  ctx.stroke()
  ctx.font = `56px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey, "MMM").toUpperCase(), 0, 4, { spacing: 6 })
  ctx.font = `24px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey, "yyyy"), 0, 38, { spacing: 8 })
  ctx.restore()

  const hostW = 132
  drawHost(ctx, eden, stubCx - hostW - 10, POSTER_H - m - 18, hostW)
  drawHost(ctx, noga, stubCx + 10, POSTER_H - m - 18, hostW)
}

function drawNeon({ ctx, films, art, monthKey, eden, noga, soup }: Ctx) {
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
    else fallbackPlate(ctx, film, x, top, w, h, "#141011", `${GOLD}cc`)

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

const RENDERERS: Record<PosterStyleId, (c: Ctx) => void> = {
  marquee: drawMarquee,
  playbill: drawPlaybill,
  ticket: drawTicket,
  neon: drawNeon,
}

/* -------------------------------------------------------------------------- */

/** Renders `style` for `monthKey` into `canvas` at 300dpi A4 landscape. */
export async function renderPoster(
  canvas: HTMLCanvasElement,
  style: PosterStyleId,
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

  RENDERERS[style]({
    ctx,
    films,
    art: art as (HTMLImageElement | null)[],
    monthKey,
    eden,
    noga,
    soup,
  })
}

export function posterFilename(style: PosterStyleId, monthKey: string) {
  return `in-the-soup-${monthKey}-${style}.jpg`
}
