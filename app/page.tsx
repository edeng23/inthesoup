"use client"

import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"
import {
  allScreenings,
  defaultMonthIndex,
  monthKeys,
  monthLabel,
  screeningsByMonth,
  totalScreenings,
  type Screening,
} from "@/lib/screenings"
import Grain from "@/components/Grain"
import PosterMaker from "@/components/PosterMaker"

const VELVET = "#0D0707"
const GOLD = "#E7C27D"
const GOLD_DIM = "#9C7C43"
const CRIMSON = "#6E1216"

/** Dissolves the bottom edge of the hosts' cut-outs into the room. */
const FADE_OUT = "linear-gradient(to bottom, #000 72%, transparent 97%)"

export default function InTheSoup() {
  const [monthIndex, setMonthIndex] = useState(() => defaultMonthIndex())
  // While a month change is pending the curtains are closed; the swap happens
  // behind them, so the audience never sees the scenery being moved.
  const [pending, setPending] = useState<number | null>(null)

  const monthKey = monthKeys[monthIndex]
  const films = screeningsByMonth[monthKey] ?? []
  const closed = pending !== null

  const go = (next: number) => {
    if (closed || next < 0 || next > monthKeys.length - 1) return
    setPending(next)
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-[family-name:var(--font-serif)]"
      style={{
        background: `radial-gradient(120% 80% at 50% -10%, #2A0F10 0%, ${VELVET} 55%, #060303 100%)`,
        color: "#F3E6CE",
      }}
    >
      <Grain opacity={0.2} blend="overlay" />
      <ProjectorBeam />
      <Curtains
        closed={closed}
        onClosed={() => {
          if (pending !== null) setMonthIndex(pending)
          setPending(null)
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pb-32 pt-10 sm:pt-16">
        {/* The sign, with the two of them standing out front like lobby
            standees. On narrow screens they move below it instead. */}
        <div className="relative">
          <MarqueeSign monthKey={monthKey} />
          <Standee src="/eden.png" name="Eden" side="left" delay={0.35} />
          <Standee src="/noga.png" name="Noga" side="right" delay={0.5} />
        </div>

        <StandeesMobile />

        {/* Programme controls -------------------------------------------- */}
        <div className="mt-10 flex items-center justify-center gap-8 sm:mt-14">
          <BrassArrow
            dir="left"
            disabled={monthIndex === 0 || closed}
            onClick={() => go(monthIndex - 1)}
          />
          <div
            className="text-center font-[family-name:var(--font-display)] text-sm tracking-[0.4em]"
            style={{ color: GOLD_DIM }}
          >
            {films.length} {films.length === 1 ? "feature" : "features"}
          </div>
          <BrassArrow
            dir="right"
            disabled={monthIndex === monthKeys.length - 1 || closed}
            onClick={() => go(monthIndex + 1)}
          />
        </div>

        {/* Tickets --------------------------------------------------------- */}
        <div className="mt-16 flex flex-col items-center gap-10 sm:mt-20 sm:gap-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={monthKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex w-full flex-col items-center gap-10 sm:gap-12"
            >
              {films.map((film, i) => (
                <Ticket key={film.title} film={film} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <TheWholePot />

        <PosterMaker monthKey={monthKey} films={films} />
      </div>

      <ProgrammeTicker />
    </div>
  )
}

/* -------------------------------------------------------------------------- */

/** The bulb-lit sign over the door. Bulbs chase around the perimeter. */
function MarqueeSign({ monthKey }: { monthKey: string }) {
  // Bulbs are laid out as evenly-spaced percentages along each edge.
  const bulbs = useMemo(() => {
    const out: { left: string; top: string; i: number }[] = []
    const perSide = 14
    let i = 0
    for (let n = 0; n < perSide; n++) {
      const p = `${(n / (perSide - 1)) * 100}%`
      out.push({ left: p, top: "0%", i: i++ })
      out.push({ left: p, top: "100%", i: i++ })
    }
    for (let n = 1; n < 5; n++) {
      const p = `${(n / 5) * 100}%`
      out.push({ left: "0%", top: p, i: i++ })
      out.push({ left: "100%", top: p, i: i++ })
    }
    return out
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto max-w-3xl"
    >
      {/* Hanging rods */}
      <div className="pointer-events-none absolute -top-10 left-1/4 h-10 w-px" style={{ background: `linear-gradient(${GOLD_DIM}, transparent)` }} />
      <div className="pointer-events-none absolute -top-10 right-1/4 h-10 w-px" style={{ background: `linear-gradient(${GOLD_DIM}, transparent)` }} />

      {/* Brass bezel. A marquee face is a heavy cast frame, so this is a wide
          band with a lit top edge and a shaded bottom one rather than a
          hairline rule — the sign has to read as an object hung on the wall. */}
      <div
        className="relative p-2.5 sm:p-3.5"
        style={{
          background:
            "linear-gradient(160deg, #D9BB84 0%, #9C7C43 20%, #7A5C2C 38%, #C9A263 50%, #86673A 66%, #B59558 84%, #6B5029 100%)",
          borderRadius: "4px",
          boxShadow: [
            "inset 0 2px 0 rgba(255,246,226,0.45)",
            "inset 0 -3px 0 rgba(0,0,0,0.55)",
            "inset 2px 0 0 rgba(255,246,226,0.14)",
            "inset -2px 0 0 rgba(0,0,0,0.35)",
            "0 0 0 1px #2B1D0C",
            "0 30px 80px rgba(0,0,0,0.85)",
            `0 0 70px ${GOLD}22`,
          ].join(", "),
        }}
      >
        {/* Rivets holding the bezel to the frame */}
        {[
          ["6px", "6px"],
          ["calc(100% - 6px)", "6px"],
          ["6px", "calc(100% - 6px)"],
          ["calc(100% - 6px)", "calc(100% - 6px)"],
        ].map(([left, top]) => (
          <span
            key={`${left}-${top}`}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
            style={{
              left,
              top,
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle at 35% 30%, #FBEBC6, #6B5029)",
              boxShadow: "0 1px 1px rgba(0,0,0,0.6)",
            }}
          />
        ))}

        <div
          className="relative px-8 py-11 text-center sm:px-20 sm:py-14"
          style={{
            // Opaque, and darker than the wall behind it, so the panel reads as
            // a solid face with the letters lit on it.
            background:
              "radial-gradient(125% 115% at 50% 0%, #1D0D0E 0%, #120809 52%, #090404 100%)",
            boxShadow:
              "inset 0 0 90px rgba(0,0,0,0.95), inset 0 0 34px rgba(231,194,125,0.09), inset 0 2px 5px rgba(0,0,0,0.9)",
          }}
        >
        <div className="pointer-events-none absolute inset-3 sm:inset-4">
          {bulbs.map((b) => (
            <span
              key={b.i}
              className="absolute h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3"
              style={{
                left: b.left,
                top: b.top,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle at 38% 32%, #FFF6DE, #E7C27D 55%, #B98F45)",
                boxShadow: `0 0 10px ${GOLD}, 0 0 26px ${GOLD}90, 0 0 44px ${GOLD}40`,
                animation: `bulb 1.6s ${(b.i % 6) * 0.18}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>

        {/* The club's own mark, lit by the sign and bobbing very slightly. */}
        <motion.img
          src="/soup.png"
          alt="A bowl of soup"
          className="mx-auto mb-1 h-16 w-16 sm:h-24 sm:w-24"
          animate={{ y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            filter: `drop-shadow(0 0 22px ${GOLD}70) drop-shadow(0 8px 14px rgba(0,0,0,0.6))`,
          }}
        />

        <div
          className="font-[family-name:var(--font-display)] leading-[0.9]"
          style={{
            fontSize: "clamp(2.6rem, 9vw, 5.6rem)",
            letterSpacing: "0.04em",
            color: "#FFF4DE",
            textShadow: `0 0 18px ${GOLD}99, 0 0 46px ${GOLD}55, 0 2px 0 ${GOLD_DIM}`,
          }}
        >
          In the Soup
        </div>

        <div
          className="mx-auto my-4 h-px w-3/4"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)` }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={monthKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="font-[family-name:var(--font-display)] tracking-[0.32em]"
            style={{ fontSize: "clamp(0.9rem, 2.4vw, 1.4rem)", color: GOLD }}
          >
            {monthLabel(monthKey).toUpperCase()}
          </motion.div>
        </AnimatePresence>

        {/* The house rules, stacked the way a real marquee breaks its lines —
            on one line the sentence can't grow past ~1.35rem before it runs
            into the sign's frame. Cormorant also runs optically small, so this
            needs more size than a sans-serif caption would. */}
        <div className="mt-5 flex flex-col items-center gap-1 italic tracking-wide">
          <span
            style={{
              fontSize: "clamp(1.2rem, 2.7vw, 1.9rem)",
              color: "#EBD4A8",
            }}
          >
            Omelettes at eight · Screening at nine
          </span>
          <span
            style={{
              fontSize: "clamp(1.05rem, 2.1vw, 1.5rem)",
              color: "#C9A97Fcc",
            }}
          >
            Location announced on the day
          </span>
        </div>
        </div>
      </div>
    </motion.div>
  )
}

/* -------------------------------------------------------------------------- */

/**
 * One screening as a cinema ticket: poster in the counterfoil window, details
 * on the stub, torn along a perforation of punched notches.
 */
function Ticket({ film, index }: { film: Screening; index: number }) {
  const tilt = index % 2 === 0 ? -1.1 : 1.1

  return (
    <motion.article
      initial={{ opacity: 0, y: 40, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ rotate: 0, y: -10, scale: 1.02 }}
      className="relative w-full max-w-3xl"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="relative flex overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #F6E7C8 0%, #EFDCB6 45%, #E4CDA1 100%)",
          color: "#2A1408",
          boxShadow: "0 26px 60px rgba(0,0,0,0.55)",
          borderRadius: "6px",
        }}
      >
        {/* Counterfoil: the poster */}
        <div className="relative w-[38%] shrink-0 sm:w-[30%]">
          <img
            src={film.posterUrl}
            alt={film.title}
            loading="lazy"
            className="poster-img h-full w-full object-cover"
            style={{ minHeight: 210 }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(42,20,8,0.25), transparent 45%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        {/* Perforation */}
        <div className="relative w-0">
          <div
            className="absolute inset-y-3 left-0 w-px"
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, #2A140855 0 6px, transparent 6px 12px)",
            }}
          />
          <span
            className="absolute -top-2.5 left-0 h-5 w-5 -translate-x-1/2 rounded-full"
            style={{ background: VELVET }}
          />
          <span
            className="absolute -bottom-2.5 left-0 h-5 w-5 -translate-x-1/2 rounded-full"
            style={{ background: VELVET }}
          />
        </div>

        {/* Stub */}
        <div className="relative flex flex-1 flex-col justify-between p-4 sm:p-7">
          {/* Box-office stamp, struck across the empty middle of the stub */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-[-14deg] sm:block"
            style={{
              border: "2px solid #8E2B1B",
              color: "#8E2B1B",
              opacity: 0.22,
              padding: "0.5rem 1rem",
              borderRadius: "4px",
            }}
          >
            <div className="font-[family-name:var(--font-display)] text-2xl leading-none tracking-[0.16em]">
              {format(parseISO(film.date), "MMM").toUpperCase()}
            </div>
            <div className="font-[family-name:var(--font-display)] text-center text-xs tracking-[0.3em]">
              {format(parseISO(film.date), "yyyy")}
            </div>
          </div>

          <div>
            <div
              className="mb-2 flex items-center justify-between font-[family-name:var(--font-display)] text-[11px] tracking-[0.28em]"
              style={{ color: "#7A4A24" }}
            >
              <span>Admit one</span>
              <span>№ {String(film.no).padStart(3, "0")}</span>
            </div>
            <h3
              className="font-[family-name:var(--font-display)] leading-[0.95]"
              style={{ fontSize: "clamp(1.7rem, 4.4vw, 3rem)", letterSpacing: "0.01em" }}
            >
              {film.title}
            </h3>
            <div
              className="mt-1 text-lg italic"
              style={{ color: "#7A4A24" }}
            >
              {film.year}
            </div>
          </div>

          <div
            className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t pt-3 font-[family-name:var(--font-display)] tracking-[0.2em]"
            style={{ borderColor: "#2A140833" }}
          >
            <div>
              <div className="text-[10px]" style={{ color: "#7A4A24" }}>
                Date
              </div>
              <div className="text-base sm:text-xl">
                {format(parseISO(film.date), "EEE d MMM yyyy").toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "#7A4A24" }}>
                Doors
              </div>
              <div className="text-base sm:text-xl">20:00</div>
            </div>
            <div>
              <div className="text-[10px]" style={{ color: "#7A4A24" }}>
                Feature
              </div>
              <div className="text-base sm:text-xl">21:00</div>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/* -------------------------------------------------------------------------- */

function BrassArrow({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right"
  disabled: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "left" ? "Previous month" : "Next month"}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
      style={{
        border: `1px solid ${disabled ? "#5a482c55" : GOLD_DIM}`,
        color: disabled ? "#5a482c" : GOLD,
        background:
          "radial-gradient(circle at 30% 25%, rgba(231,194,125,0.14), rgba(0,0,0,0.35))",
        boxShadow: disabled ? "none" : `0 0 22px ${GOLD}22`,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {dir === "left" ? "‹" : "›"}
    </motion.button>
  )
}

/** Velvet curtains that close over a month change and reopen on the new one. */
function Curtains({ closed, onClosed }: { closed: boolean; onClosed: () => void }) {
  const panel = (side: "left" | "right") => (
    <motion.div
      className="fixed top-0 z-[90] h-full w-1/2"
      style={{
        [side]: 0,
        background: `repeating-linear-gradient(90deg, ${CRIMSON} 0px, #8E1B20 14px, #4E0C10 34px, ${CRIMSON} 48px)`,
        boxShadow: "inset 0 0 120px rgba(0,0,0,0.75)",
      }}
      initial={false}
      animate={{ x: closed ? "0%" : side === "left" ? "-100%" : "100%" }}
      transition={{ duration: closed ? 0.5 : 0.75, ease: closed ? [0.7, 0, 0.84, 0] : [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (closed && side === "left") onClosed()
      }}
    >
      <div
        className="absolute inset-y-0 w-8"
        style={{
          [side === "left" ? "right" : "left"]: 0,
          background:
            side === "left"
              ? "linear-gradient(90deg, transparent, rgba(0,0,0,0.6))"
              : "linear-gradient(270deg, transparent, rgba(0,0,0,0.6))",
        }}
      />
    </motion.div>
  )

  return (
    <>
      {panel("left")}
      {panel("right")}
    </>
  )
}

/** A wash of projector light from above the sign. */
function ProjectorBeam() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[70vh]"
      style={{
        background:
          "conic-gradient(from 175deg at 50% -20%, transparent 0deg, rgba(231,194,125,0.10) 8deg, rgba(231,194,125,0.02) 16deg, transparent 24deg)",
        filter: "blur(18px)",
      }}
    />
  )
}

/**
 * A cut-out of one of the hosts, stood in front of the marquee the way a
 * cinema props a cardboard standee in its lobby: lit from the sign, drifting
 * very slightly, with a brass nameplate at their feet.
 */
function Standee({
  src,
  name,
  side,
  delay,
}: {
  src: string
  name: string
  side: "left" | "right"
  delay: number
}) {
  const drift = side === "left" ? [-1.6, 1.4, -1.6] : [1.6, -1.4, 1.6]

  return (
    <motion.div
      className="absolute bottom-[-18px] z-20 hidden lg:block"
      style={{ [side]: "-1.5%", width: "clamp(135px, 13vw, 200px)" }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        animate={{ y: [0, -9, 0], rotate: drift }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay }}
        whileHover={{ scale: 1.06, y: -16 }}
      >
        {/* Sign-light spill behind them */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-18%] top-[6%] h-[70%]"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${GOLD}2e, transparent 68%)`,
            filter: "blur(18px)",
          }}
        />
        <img
          src={src}
          alt={name}
          className="relative w-full"
          style={{
            filter: "drop-shadow(0 22px 26px rgba(0,0,0,0.7)) saturate(0.92)",
            // The photos are chest-up crops; dissolving the lower edge stops
            // them reading as rectangles pasted onto the wall.
            maskImage: FADE_OUT,
            WebkitMaskImage: FADE_OUT,
          }}
        />
      </motion.div>

    </motion.div>
  )
}

/** Below `lg` there is no room beside the sign, so they stand under it. */
function StandeesMobile() {
  return (
    <div className="mt-8 flex items-end justify-center gap-6 lg:hidden">
      {[
        { src: "/eden.png", name: "Eden", drift: [-1.6, 1.4, -1.6] },
        { src: "/noga.png", name: "Noga", drift: [1.6, -1.4, 1.6] },
      ].map((p, i) => (
        <motion.div
          key={p.name}
          className="w-28 sm:w-36"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 + i * 0.12 }}
        >
          <motion.img
            src={p.src}
            alt={p.name}
            className="w-full"
            style={{
              filter: "drop-shadow(0 16px 20px rgba(0,0,0,0.7))",
              maskImage: FADE_OUT,
              WebkitMaskImage: FADE_OUT,
            }}
            animate={{ y: [0, -6, 0], rotate: p.drift }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * The lobby wall: every film the club has ever run, hung in gold hairline
 * frames and dimmed to house lights. Pointing at one brings it up to full
 * colour, and the wall label underneath reads out what you're looking at.
 */
function TheWholePot() {
  const [active, setActive] = useState<Screening | null>(null)

  return (
    <section
      className="mt-28"
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setActive(null)
      }}
    >
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-5 h-px w-24"
          style={{ background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)` }}
        />
        <h2
          className="font-[family-name:var(--font-display)] leading-none"
          style={{
            fontSize: "clamp(1.9rem, 5.5vw, 3.4rem)",
            color: "#FFF4DE",
            textShadow: `0 0 22px ${GOLD}55`,
            letterSpacing: "0.03em",
          }}
        >
          The Whole Pot
        </h2>
      </div>

      <div
        className="p-3 sm:p-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(0,0,0,0.25))",
          border: `1px solid ${GOLD_DIM}33`,
          boxShadow: "inset 0 0 70px rgba(0,0,0,0.6)",
        }}
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 lg:grid-cols-9">
          {allScreenings.map((film) => (
            <motion.button
              key={film.no}
              type="button"
              className="relative cursor-pointer"
              style={{ aspectRatio: "2 / 3" }}
              initial="rest"
              whileHover="lit"
              animate={active?.no === film.no ? "lit" : "rest"}
              onHoverStart={() => setActive(film)}
              onClick={() => setActive((c) => (c?.no === film.no ? null : film))}
              variants={{
                rest: { scale: 1, zIndex: 1 },
                lit: { scale: 1.16, zIndex: 30 },
              }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              title={`${film.title} (${film.year})`}
              aria-label={`${film.title} (${film.year})`}
            >
              <motion.img
                src={film.posterUrl}
                alt={film.title}
                loading="lazy"
                className="poster-img h-full w-full object-cover"
                variants={{
                  rest: {
                    filter: "sepia(0.32) saturate(0.75) brightness(0.6)",
                    boxShadow: `0 0 0 1px ${GOLD_DIM}44`,
                  },
                  lit: {
                    filter: "sepia(0) saturate(1.05) brightness(1)",
                    boxShadow: `0 0 0 1px ${GOLD}, 0 18px 40px rgba(0,0,0,0.75)`,
                  },
                }}
                transition={{ duration: 0.35 }}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Wall label */}
      <div
        className="mt-5 flex min-h-[3.25rem] items-center justify-center px-4 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active ? active.no : "idle"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {active ? (
              <>
                <span
                  className="font-[family-name:var(--font-display)] tracking-[0.14em]"
                  style={{ fontSize: "clamp(1.1rem, 3vw, 1.7rem)", color: "#FFF4DE" }}
                >
                  {active.title}
                </span>
                <span className="mx-3 italic" style={{ color: "#C9A97F99" }}>
                  {active.year}
                </span>
                <span
                  className="font-[family-name:var(--font-display)] text-xs tracking-[0.28em]"
                  style={{ color: GOLD_DIM }}
                >
                  № {String(active.no).padStart(3, "0")} ·{" "}
                  {format(parseISO(active.date), "d MMM yyyy").toUpperCase()}
                </span>
              </>
            ) : (
              <span
                className="font-[family-name:var(--font-display)] text-xs tracking-[0.36em]"
                style={{ color: GOLD_DIM }}
              >
                {totalScreenings} films · {monthKeys.length} months
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}

/** Every title we've ever shown, running along the bottom of the house. */
function ProgrammeTicker() {
  const titles = useMemo(() => allScreenings.map((s) => s.title), [])
  const strip = [...titles, ...titles]

  return (
    <div
      className="ticker fixed inset-x-0 bottom-0 z-[80] overflow-hidden py-3"
      style={{
        background: "rgba(6,3,3,0.9)",
        borderTop: `1px solid ${GOLD_DIM}44`,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="ticker-track font-[family-name:var(--font-display)] text-sm tracking-[0.28em]"
        style={{ ["--ticker-duration" as string]: "160s", color: `${GOLD}bb` }}
      >
        {strip.map((t, i) => (
          <span key={i} className="px-5">
            {t.toUpperCase()}
            <span style={{ color: `${GOLD}55` }} className="pl-5">
              ✦
            </span>
          </span>
        ))}
      </div>
      <span className="sr-only">{totalScreenings} films shown to date</span>
    </div>
  )
}
