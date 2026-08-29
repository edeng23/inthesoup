import { format, parseISO } from "date-fns"
import { monthLabel, type Screening } from "@/lib/screenings"

/**
 * Draws the month's programme as a shareable poster on a canvas.
 *
 * Canvas rather than a DOM screenshot: it uses the page's already-loaded
 * webfonts directly, exports crisply at any size, and — importantly — only
 * ever touches same-origin images, so the canvas is never tainted. Film
 * artwork is deliberately left out: some of the poster hosts we link to send
 * no CORS headers, which would make the export fail for certain months.
 */

export const POSTER_W = 1080
export const POSTER_H = 1620

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`could not load ${src}`))
    img.src = src
  })
}

/** Shrinks `size` until `text` fits `maxWidth`. */
function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
  size: number,
  min = 16,
  spacing = 0
) {
  let s = size
  while (s > min) {
    ctx.font = `${s}px ${font}`
    if (measure(ctx, text, spacing) <= maxWidth) break
    s -= 2
  }
  ctx.font = `${s}px ${font}`
  return s
}

/** Width of `text` including manual letter spacing. */
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
  const previous = ctx.textAlign
  ctx.textAlign = "left"
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + spacing
  }
  ctx.textAlign = previous
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

/**
 * Draws one of the hosts, dissolving the bottom of the crop into `fade` so the
 * cut-out doesn't end in a hard rectangle — the same treatment as on the site.
 */
function drawHost(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  bottom: number,
  width: number,
  fade: string,
  filter?: string
) {
  const height = (img.height / img.width) * width
  const top = bottom - height
  ctx.save()
  if (filter) ctx.filter = filter
  ctx.drawImage(img, x, top, width, height)
  ctx.restore()

  const gradient = ctx.createLinearGradient(0, top + height * 0.55, 0, bottom)
  gradient.addColorStop(0, `${fade}00`)
  gradient.addColorStop(1, fade)
  ctx.fillStyle = gradient
  ctx.fillRect(x, top + height * 0.55, width, height * 0.45)
}

/** A ring of lit bulbs inset from the edge of a rectangle. */
function bulbRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  perSide: number,
  radius: number
) {
  const dots: [number, number][] = []
  for (let i = 0; i < perSide; i++) {
    const t = i / (perSide - 1)
    dots.push([x + t * w, y], [x + t * w, y + h])
  }
  const down = Math.max(2, Math.round(perSide * 0.42))
  for (let i = 1; i < down; i++) {
    const t = i / down
    dots.push([x, y + t * h], [x + w, y + t * h])
  }
  for (const [cx, cy] of dots) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 4)
    glow.addColorStop(0, "rgba(231,194,125,0.55)")
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

/** Paper speckle, so the flat stock doesn't read as a screen fill. */
function speckle(ctx: CanvasRenderingContext2D, count: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  for (let i = 0; i < count; i++) {
    const x = Math.random() * POSTER_W
    const y = Math.random() * POSTER_H
    ctx.globalAlpha = Math.random() * 0.06
    ctx.fillRect(x, y, 1.5, 1.5)
  }
  ctx.restore()
}

type Ctx = {
  ctx: CanvasRenderingContext2D
  films: Screening[]
  monthKey: string
  eden: HTMLImageElement
  noga: HTMLImageElement
  soup: HTMLImageElement
}

const dayLine = (film: Screening) =>
  format(parseISO(film.date), "EEEE d MMMM").toUpperCase()

/* -------------------------------------------------------------------------- */
/* layout                                                                      */

/**
 * Spreads `count` entries down the band between `top` and `bottom`, capped at
 * `maxStep` so a two-film month doesn't drift apart, and centred so a
 * four-film month doesn't crowd the footer. Returns the baseline of the first
 * entry's title and the step between entries.
 */
function filmLayout(
  top: number,
  bottom: number,
  count: number,
  maxStep: number,
  entryH: number,
  ascent: number
) {
  const available = bottom - top
  const step = Math.min(maxStep, available / Math.max(count, 1))
  const blockH = (count - 1) * step + entryH
  return { step, first: top + Math.max(0, (available - blockH) / 2) + ascent }
}

/* -------------------------------------------------------------------------- */
/* styles                                                                      */

function drawMarquee({ ctx, films, monthKey, eden, noga, soup }: Ctx) {
  const bg = ctx.createRadialGradient(
    POSTER_W / 2,
    -200,
    50,
    POSTER_W / 2,
    POSTER_H * 0.7,
    POSTER_H
  )
  bg.addColorStop(0, "#2A0F10")
  bg.addColorStop(0.55, "#0D0707")
  bg.addColorStop(1, "#060303")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  // Brass bezel
  const m = 56
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

  const b = 18
  const face = ctx.createRadialGradient(
    POSTER_W / 2,
    m + b,
    40,
    POSTER_W / 2,
    POSTER_H / 2,
    POSTER_H * 0.8
  )
  face.addColorStop(0, "#1D0D0E")
  face.addColorStop(0.52, "#120809")
  face.addColorStop(1, "#090404")
  ctx.fillStyle = face
  ctx.fillRect(m + b, m + b, POSTER_W - (m + b) * 2, POSTER_H - (m + b) * 2)

  const inset = m + b + 30
  bulbRing(ctx, inset, inset, POSTER_W - inset * 2, POSTER_H - inset * 2, 11, 9)

  const cx = POSTER_W / 2

  // Hosts first: anything drawn after them reads as being in front.
  const hostW = 165
  drawHost(ctx, eden, m + b + 20, POSTER_H - m - b - 8, hostW, "#0A0505")
  drawHost(
    ctx,
    noga,
    POSTER_W - m - b - hostW - 20,
    POSTER_H - m - b - 8,
    hostW,
    "#0A0505"
  )

  const soupW = 190
  ctx.drawImage(soup, cx - soupW / 2, 168, soupW, soupW)

  ctx.fillStyle = "#FFF4DE"
  ctx.shadowColor = "rgba(231,194,125,0.6)"
  ctx.shadowBlur = 40
  fit(ctx, "IN THE SOUP", POSTER_W - 340, displayFont(), 148, 60, 4)
  drawText(ctx, "IN THE SOUP", cx, 470, { spacing: 4 })
  ctx.shadowBlur = 0

  ctx.strokeStyle = GOLD_DIM
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx - 260, 512)
  ctx.lineTo(cx + 260, 512)
  ctx.stroke()

  ctx.fillStyle = GOLD
  ctx.font = `44px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey).toUpperCase(), cx, 578, { spacing: 14 })

  // A four-film month has to give up some air between entries.
  const tight = films.length >= 4
  const { step, first } = filmLayout(
    tight ? 610 : 640,
    1250,
    films.length,
    208,
    tight ? 96 : 112,
    tight ? 54 : 62
  )
  let y = first
  for (const film of films) {
    ctx.fillStyle = CREAM
    fit(ctx, film.title.toUpperCase(), POSTER_W - 300, displayFont(), tight ? 70 : 82, 34, 2)
    drawText(ctx, film.title.toUpperCase(), cx, y, { spacing: 2 })

    ctx.fillStyle = "#C9A97F"
    ctx.font = `italic ${tight ? 34 : 40}px ${serifFont()}`
    drawText(ctx, `${film.year}  ·  ${dayLine(film)}`, cx, y + (tight ? 44 : 52))

    ctx.strokeStyle = "rgba(231,194,125,0.18)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 150, y + (tight ? 76 : 92))
    ctx.lineTo(cx + 150, y + (tight ? 76 : 92))
    ctx.stroke()

    y += step
  }

  ctx.fillStyle = "#EBD4A8"
  ctx.font = `italic 42px ${serifFont()}`
  drawText(ctx, "Omelettes at eight · Screening at nine", cx, 1312)
  ctx.fillStyle = "#C9A97Fcc"
  ctx.font = `italic 34px ${serifFont()}`
  drawText(ctx, "Location announced on the day", cx, 1364)
}

function drawPlaybill({ ctx, films, monthKey, eden, noga }: Ctx) {
  ctx.fillStyle = "#EFE7D6"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)
  speckle(ctx, 5200, "#4A3A22")

  const ink = "#16120D"
  const red = "#9A2B1C"
  const cx = POSTER_W / 2

  const grey = "grayscale(1) contrast(1.15)"
  const hostW = 152
  drawHost(ctx, eden, 96, POSTER_H - 74, hostW, "#EFE7D6", grey)
  drawHost(ctx, noga, POSTER_W - hostW - 96, POSTER_H - 74, hostW, "#EFE7D6", grey)

  ctx.strokeStyle = ink
  ctx.lineWidth = 6
  ctx.strokeRect(46, 46, POSTER_W - 92, POSTER_H - 92)
  ctx.lineWidth = 1.5
  ctx.strokeRect(62, 62, POSTER_W - 124, POSTER_H - 124)

  ctx.fillStyle = ink
  ctx.font = `34px ${displayFont()}`
  drawText(ctx, "A FILM CLUB · EST. MMXXIV", cx, 160, { spacing: 10 })

  fit(ctx, "IN THE SOUP", POSTER_W - 240, displayFont(), 168, 70, 2)
  drawText(ctx, "IN THE SOUP", cx, 300, { spacing: 2 })

  ctx.font = `30px ${displayFont()}`
  ctx.fillStyle = red
  drawText(ctx, "✦   PROGRAMME FOR   ✦", cx, 366, { spacing: 8 })
  ctx.fillStyle = ink
  ctx.font = `62px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey).toUpperCase(), cx, 442, { spacing: 8 })

  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(150, 486)
  ctx.lineTo(POSTER_W - 150, 486)
  ctx.stroke()

  const tight = films.length >= 4
  const { step, first } = filmLayout(
    tight ? 512 : 530,
    1230,
    films.length,
    224,
    tight ? 132 : 150,
    tight ? 80 : 90
  )
  let y = first
  films.forEach((film, i) => {
    if (i > 0) {
      ctx.strokeStyle = ink
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(230, y - 96)
      ctx.lineTo(POSTER_W - 230, y - 96)
      ctx.stroke()
      ctx.fillStyle = "#EFE7D6"
      ctx.fillRect(cx - 34, y - 120, 68, 44)
      ctx.fillStyle = red
      ctx.font = `26px ${displayFont()}`
      drawText(ctx, "✦", cx, y - 88)
    }

    ctx.fillStyle = red
    ctx.font = `${tight ? 28 : 32}px ${displayFont()}`
    drawText(ctx, dayLine(film), cx, y - (tight ? 30 : 34), { spacing: 8 })

    ctx.fillStyle = ink
    fit(ctx, film.title.toUpperCase(), POSTER_W - 240, displayFont(), tight ? 76 : 88, 32, 1)
    drawText(ctx, film.title.toUpperCase(), cx, y + (tight ? 36 : 42), { spacing: 1 })

    ctx.font = `italic ${tight ? 32 : 38}px ${serifFont()}`
    drawText(ctx, film.year, cx, y + (tight ? 76 : 88))

    y += step
  })

  ctx.strokeStyle = ink
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(150, 1268)
  ctx.lineTo(POSTER_W - 150, 1268)
  ctx.stroke()

  ctx.fillStyle = ink
  ctx.font = `36px ${displayFont()}`
  drawText(ctx, "OMELETTES 20:00   ·   SCREENING 21:00", cx, 1330, { spacing: 6 })
  ctx.font = `italic 34px ${serifFont()}`
  drawText(ctx, "Location announced on the day", cx, 1382)
}

function drawTicket({ ctx, films, monthKey, eden, noga }: Ctx) {
  ctx.fillStyle = "#0D0707"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const m = 54
  const w = POSTER_W - m * 2
  const h = POSTER_H - m * 2
  const stock = ctx.createLinearGradient(m, m, POSTER_W - m, POSTER_H - m)
  stock.addColorStop(0, "#F6E7C8")
  stock.addColorStop(0.45, "#EFDCB6")
  stock.addColorStop(1, "#E4CDA1")
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.6)"
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 20
  ctx.fillStyle = stock
  roundRect(ctx, m, m, w, h, 14)
  ctx.fill()
  ctx.restore()

  const ink = "#2A1408"
  const sub = "#7A4A24"
  const cx = POSTER_W / 2
  const tear = POSTER_H - 470

  const hostW = 150
  drawHost(ctx, eden, m + 40, POSTER_H - m - 24, hostW, "#EFDCB6")
  drawHost(ctx, noga, POSTER_W - m - hostW - 40, POSTER_H - m - 24, hostW, "#EFDCB6")

  // Punched notches at the tear line
  ctx.fillStyle = "#0D0707"
  ctx.beginPath()
  ctx.arc(m, tear, 26, 0, Math.PI * 2)
  ctx.arc(POSTER_W - m, tear, 26, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = "rgba(42,20,8,0.45)"
  ctx.lineWidth = 3
  ctx.setLineDash([12, 12])
  ctx.beginPath()
  ctx.moveTo(m + 40, tear)
  ctx.lineTo(POSTER_W - m - 40, tear)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = sub
  ctx.font = `36px ${displayFont()}`
  drawText(ctx, "ADMIT ONE", m + 56, 176, { spacing: 12, align: "left" })
  drawText(ctx, monthLabel(monthKey, "MM / yyyy"), POSTER_W - m - 56, 176, {
    spacing: 12,
    align: "right",
  })

  ctx.fillStyle = ink
  fit(ctx, "IN THE SOUP", w - 160, displayFont(), 150, 60, 2)
  drawText(ctx, "IN THE SOUP", cx, 322, { spacing: 2 })

  ctx.fillStyle = sub
  ctx.font = `48px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey).toUpperCase(), cx, 392, { spacing: 12 })

  ctx.strokeStyle = "rgba(42,20,8,0.25)"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(m + 56, 440)
  ctx.lineTo(POSTER_W - m - 56, 440)
  ctx.stroke()

  const { step, first } = filmLayout(480, tear - 60, films.length, 176, 140, 40)
  let y = first
  films.forEach((film) => {
    ctx.fillStyle = sub
    ctx.font = `28px ${displayFont()}`
    drawText(ctx, `№ ${String(film.no).padStart(3, "0")}`, m + 56, y, {
      spacing: 6,
      align: "left",
    })
    drawText(ctx, dayLine(film), POSTER_W - m - 56, y, { spacing: 6, align: "right" })

    ctx.fillStyle = ink
    fit(ctx, film.title.toUpperCase(), w - 130, displayFont(), 74, 30, 1)
    drawText(ctx, film.title.toUpperCase(), cx, y + 66, { spacing: 1 })

    ctx.fillStyle = sub
    ctx.font = `italic 34px ${serifFont()}`
    drawText(ctx, film.year, cx, y + 108)

    y += step
  })

  // Stub
  ctx.fillStyle = sub
  ctx.font = `30px ${displayFont()}`
  const stubY = tear + 96
  drawText(ctx, "DOORS", m + 130, stubY, { spacing: 8 })
  drawText(ctx, "FEATURE", cx, stubY, { spacing: 8 })
  drawText(ctx, "PLACE", POSTER_W - m - 130, stubY, { spacing: 8 })

  ctx.fillStyle = ink
  ctx.font = `56px ${displayFont()}`
  drawText(ctx, "20:00", m + 130, stubY + 66, { spacing: 3 })
  drawText(ctx, "21:00", cx, stubY + 66, { spacing: 3 })
  ctx.font = `30px ${displayFont()}`
  drawText(ctx, "ON THE DAY", POSTER_W - m - 130, stubY + 60, { spacing: 3 })

  // Box-office stamp, struck in the clear middle of the stub between the hosts
  ctx.save()
  ctx.translate(cx, POSTER_H - 168)
  ctx.rotate((-14 * Math.PI) / 180)
  ctx.globalAlpha = 0.26
  ctx.strokeStyle = "#8E2B1B"
  ctx.fillStyle = "#8E2B1B"
  ctx.lineWidth = 5
  roundRect(ctx, -110, -56, 220, 112, 8)
  ctx.stroke()
  ctx.font = `62px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey, "MMM").toUpperCase(), 0, 6, { spacing: 6 })
  ctx.font = `28px ${displayFont()}`
  drawText(ctx, monthLabel(monthKey, "yyyy"), 0, 42, { spacing: 8 })
  ctx.restore()
}

function drawNeon({ ctx, films, monthKey, eden, noga, soup }: Ctx) {
  ctx.fillStyle = "#080607"
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const halo = ctx.createRadialGradient(
    POSTER_W / 2,
    420,
    30,
    POSTER_W / 2,
    520,
    900
  )
  halo.addColorStop(0, "rgba(231,194,125,0.20)")
  halo.addColorStop(0.5, "rgba(160,40,40,0.10)")
  halo.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = halo
  ctx.fillRect(0, 0, POSTER_W, POSTER_H)

  const cx = POSTER_W / 2

  const hostW = 168
  drawHost(ctx, eden, 60, POSTER_H - 30, hostW, "#080607")
  drawHost(ctx, noga, POSTER_W - hostW - 60, POSTER_H - 30, hostW, "#080607")

  const soupW = 150
  ctx.save()
  ctx.shadowColor = "rgba(231,194,125,0.55)"
  ctx.shadowBlur = 50
  ctx.drawImage(soup, cx - soupW / 2, 150, soupW, soupW)
  ctx.restore()

  // Tube-lit title: a wide soft glow, then a hot core.
  const title = "IN THE SOUP"
  fit(ctx, title, POSTER_W - 200, displayFont(), 172, 70, 6)
  ctx.save()
  ctx.shadowColor = "rgba(255,196,120,0.9)"
  ctx.fillStyle = "rgba(255,226,178,0.35)"
  ctx.shadowBlur = 90
  drawText(ctx, title, cx, 430, { spacing: 6 })
  ctx.shadowBlur = 46
  ctx.fillStyle = "#FFF3DC"
  drawText(ctx, title, cx, 430, { spacing: 6 })
  ctx.restore()

  ctx.fillStyle = GOLD
  ctx.font = `40px ${displayFont()}`
  ctx.save()
  ctx.shadowColor = "rgba(231,194,125,0.7)"
  ctx.shadowBlur = 28
  drawText(ctx, monthLabel(monthKey).toUpperCase(), cx, 512, { spacing: 18 })
  ctx.restore()

  const tight = films.length >= 4
  const { step, first } = filmLayout(
    tight ? 556 : 580,
    1244,
    films.length,
    210,
    tight ? 126 : 150,
    tight ? 84 : 96
  )
  let y = first
  films.forEach((film, i) => {
    // In a tight month there isn't clearance for a rule between entries
    // without it crowding the year above it, so the spacing carries the split.
    if (i > 0 && !tight) {
      ctx.strokeStyle = "rgba(231,194,125,0.18)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(190, y - 78)
      ctx.lineTo(POSTER_W - 190, y - 78)
      ctx.stroke()
    }

    ctx.fillStyle = "rgba(231,194,125,0.75)"
    ctx.font = `${tight ? 24 : 28}px ${displayFont()}`
    drawText(ctx, dayLine(film), cx, y - (tight ? 20 : 24), { spacing: 10 })

    ctx.save()
    ctx.fillStyle = "#F7F1E6"
    ctx.shadowColor = "rgba(255,220,170,0.35)"
    ctx.shadowBlur = 26
    fit(ctx, film.title.toUpperCase(), POSTER_W - 260, displayFont(), tight ? 68 : 80, 30, 2)
    drawText(ctx, film.title.toUpperCase(), cx, y + (tight ? 44 : 52), { spacing: 2 })
    ctx.restore()

    ctx.fillStyle = "rgba(246,239,223,0.45)"
    ctx.font = `italic ${tight ? 30 : 36}px ${serifFont()}`
    drawText(ctx, film.year, cx, y + (tight ? 82 : 96))

    y += step
  })

  ctx.strokeStyle = "rgba(231,194,125,0.22)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(140, 1274)
  ctx.lineTo(POSTER_W - 140, 1274)
  ctx.stroke()

  ctx.fillStyle = "#EBD4A8"
  ctx.font = `italic 40px ${serifFont()}`
  drawText(ctx, "Omelettes at eight · Screening at nine", cx, 1336)
  ctx.fillStyle = "rgba(201,169,127,0.72)"
  ctx.font = `italic 32px ${serifFont()}`
  drawText(ctx, "Location announced on the day", cx, 1384)
}

const RENDERERS: Record<PosterStyleId, (c: Ctx) => void> = {
  marquee: drawMarquee,
  playbill: drawPlaybill,
  ticket: drawTicket,
  neon: drawNeon,
}

/* -------------------------------------------------------------------------- */

/** Renders `style` for `monthKey` into `canvas` at 2× for a crisp export. */
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

  const [eden, noga, soup] = await Promise.all([
    loadImage("/eden.png"),
    loadImage("/noga.png"),
    loadImage("/soup.png"),
  ])

  RENDERERS[style]({ ctx, films, monthKey, eden, noga, soup })
}

export function posterFilename(style: PosterStyleId, monthKey: string) {
  return `in-the-soup-${monthKey}-${style}.png`
}
