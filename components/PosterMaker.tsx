"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { monthLabel, type Screening } from "@/lib/screenings"
import {
  POSTER_H,
  POSTER_STYLES,
  POSTER_W,
  posterFilename,
  renderPoster,
  type PosterStyleId,
} from "@/lib/poster"

const GOLD = "#E7C27D"
const GOLD_DIM = "#9C7C43"

/**
 * The secret at the foot of the page: a single mark that opens a panel for
 * printing the month's programme as a poster.
 */
export default function PosterMaker({
  monthKey,
  films,
}: {
  monthKey: string
  films: Screening[]
}) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<PosterStyleId>("marquee")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(async () => {
    if (!canvas.current) return
    setBusy(true)
    setError(null)
    try {
      await renderPoster(canvas.current, style, monthKey, films)
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not draw the poster")
    } finally {
      setBusy(false)
    }
  }, [style, monthKey, films])

  useEffect(() => {
    if (open) void draw()
  }, [open, draw])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const download = () => {
    // JPEG, not PNG: an A4 sheet at 300dpi carrying photographic artwork is
    // several times smaller this way, with no visible loss in print.
    canvas.current?.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = posterFilename(style, monthKey)
      a.click()
      URL.revokeObjectURL(url)
    }, "image/jpeg", 0.94)
  }

  return (
    <>
      {/* The mark. Quiet until you go looking for it. */}
      <div className="mt-24 flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-3 px-4 py-2 transition-opacity duration-500"
          style={{ opacity: 0.22 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.22")}
          aria-label="Make a poster of this month's programme"
        >
          <span style={{ color: GOLD, fontSize: 20, lineHeight: 1 }}>✦</span>
          <span
            className="font-[family-name:var(--font-display)] text-[11px] tracking-[0.4em] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ color: GOLD_DIM }}
          >
            PRINT THE BILL
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(4,2,2,0.92)", backdropFilter: "blur(8px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="my-auto w-full max-w-5xl"
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="p-5 sm:p-8"
                style={{
                  background: "linear-gradient(180deg, #180C0C, #0C0606)",
                  border: `1px solid ${GOLD_DIM}55`,
                  boxShadow: "0 40px 120px rgba(0,0,0,0.8)",
                }}
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div
                      className="font-[family-name:var(--font-display)] text-2xl tracking-[0.12em] sm:text-3xl"
                      style={{ color: "#FFF4DE" }}
                    >
                      PRINT THE BILL
                    </div>
                    <div
                      className="mt-1 text-sm italic"
                      style={{ color: "#C9A97Faa" }}
                    >
                      {monthLabel(monthKey)} — {films.length}{" "}
                      {films.length === 1 ? "feature" : "features"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1 text-xl leading-none"
                    style={{ color: GOLD_DIM }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid gap-6">
                  <div>
                    <div
                      className="mb-3 font-[family-name:var(--font-display)] text-[11px] tracking-[0.36em]"
                      style={{ color: GOLD_DIM }}
                    >
                      CHOOSE A STYLE
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {POSTER_STYLES.map((s) => {
                        const on = s.id === style
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setStyle(s.id)}
                            className="px-4 py-3 text-left transition-colors duration-200"
                            style={{
                              border: `1px solid ${on ? GOLD : `${GOLD_DIM}44`}`,
                              background: on
                                ? "rgba(231,194,125,0.10)"
                                : "transparent",
                            }}
                          >
                            <div
                              className="font-[family-name:var(--font-display)] tracking-[0.18em]"
                              style={{ color: on ? "#FFF4DE" : "#C9A97F" }}
                            >
                              {s.name.toUpperCase()}
                            </div>
                            <div
                              className="mt-0.5 text-xs italic"
                              style={{ color: "#C9A97F88" }}
                            >
                              {s.blurb}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={download}
                      disabled={busy}
                      className="mt-5 w-full px-5 py-3 font-[family-name:var(--font-display)] tracking-[0.24em] transition-opacity"
                      style={{
                        background: "linear-gradient(180deg, #C9A263, #8A6A34)",
                        color: "#1A0D06",
                        opacity: busy ? 0.5 : 1,
                        cursor: busy ? "wait" : "pointer",
                      }}
                    >
                      {busy ? "PRINTING…" : "DOWNLOAD A4"}
                    </button>

                    {error && (
                      <div className="mt-3 text-xs" style={{ color: "#E8564A" }}>
                        {error}
                      </div>
                    )}
                  </div>

                  <div
                    className="flex items-center justify-center p-3"
                    style={{ background: "#050303", border: `1px solid ${GOLD_DIM}22` }}
                  >
                    <canvas
                      ref={canvas}
                      className="h-auto w-full"
                      style={{
                        aspectRatio: `${POSTER_W} / ${POSTER_H}`,
                        maxHeight: "62vh",
                        opacity: busy ? 0.4 : 1,
                        transition: "opacity 200ms",
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
