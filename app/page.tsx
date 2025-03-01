"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, addMonths, parseISO } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { useSpring, animated } from "react-spring"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react"
import { moviesData, type Movie } from "@/data/movies"
import "@/styles/wordart.css"
import RetroAsteroids from "../components/RetroAsteroids"

// Define the color scheme type
type ColorScheme = {
  baseHue: number
  complementaryHue: number
  baseSaturation: number
  baseLightness: number
  screenSaturation: number
  screenLightness: number
}

// Define the generateColorScheme function outside the component
const generateColorScheme = (): ColorScheme => {
  const baseHue = Math.floor(Math.random() * 360)
  const complementaryHue = (baseHue + 180) % 360
  return {
    baseHue,
    complementaryHue,
    baseSaturation: 70,
    baseLightness: 50,
    screenSaturation: 30,
    screenLightness: 10,
  }
}

export default function FilmClub() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [movies, setMovies] = useState<Movie[]>([])
  const [colorScheme, setColorScheme] = useState<ColorScheme>(generateColorScheme())

  useEffect(() => {
    const monthKey = format(currentMonth, "yyyy-MM")
    setMovies(moviesData[monthKey] || [])
    setColorScheme(generateColorScheme())
  }, [currentMonth])

  const fadeIn = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 1000 },
  })

  // Helper function to create animated title with words as units
  const renderAnimatedTitle = (text: string) => {
    // Split by words instead of characters
    return text.split(' ').map((word, i) => (
      <span
        key={i}
        className="inline-block"
        style={{ '--i': i } as React.CSSProperties}
      >
        {word}
        {/* Add space after each word except the last one */}
        {i < text.split(' ').length - 1 ? '\u00A0' : ''}
      </span>
    ));
  };

  // Helper to check if a month has movie data
  const hasMoviesForMonth = (date: Date) => {
    const monthKey = format(date, "yyyy-MM");
    return !!moviesData[monthKey] && moviesData[monthKey].length > 0;
  };

  // Find earliest and latest months with data
  const getNavigationLimits = () => {
    const monthKeys = Object.keys(moviesData).sort();
    if (monthKeys.length === 0) return { earliest: null, latest: null };

    return {
      earliest: parseISO(`${monthKeys[0]}-01`),
      latest: parseISO(`${monthKeys[monthKeys.length - 1]}-01`)
    };
  };

  const { earliest, latest } = getNavigationLimits();

  // Check if we're at the earliest or latest month with data
  const isPreviousDisabled = earliest ?
    format(currentMonth, "yyyy-MM") === format(earliest, "yyyy-MM") : true;
  const isNextDisabled = latest ?
    format(currentMonth, "yyyy-MM") === format(latest, "yyyy-MM") : true;

  const handlePreviousMonth = () => {
    const prevMonth = addMonths(currentMonth, -1);
    if (hasMoviesForMonth(prevMonth) || (earliest && format(prevMonth, "yyyy-MM") >= format(earliest, "yyyy-MM"))) {
      setCurrentMonth(prevMonth);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (hasMoviesForMonth(nextMonth) || (latest && format(nextMonth, "yyyy-MM") <= format(latest, "yyyy-MM"))) {
      setCurrentMonth(nextMonth);
    }
  };

  return (
    <div
      className="min-h-screen max-h-screen text-green-400 relative overflow-hidden p-4 flex flex-col"
      style={{
        backgroundColor: `hsl(${colorScheme.baseHue}, ${colorScheme.screenSaturation}%, ${colorScheme.screenLightness}%)`,
        height: '100vh',
        overscrollBehavior: 'none'
      }}
    >
      {/* Retro Asteroids Background */}
      <RetroAsteroids colorScheme={colorScheme} />

      {/* Floating PNGs - circles on mobile only */}
      <motion.div
        className="absolute top-4 left-4 w-24 h-24 z-5 rounded-full overflow-hidden border-2 border-green-400 sm:hidden"
        initial={{ y: 0 }}
        animate={{
          y: [0, -5, 0],
          rotate: [-2, 2, -2]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.1 }}
      >
        <img
          src="/eden.png"
          alt="Eden"
          className="w-full h-full object-cover"
        />
      </motion.div>
      <motion.div
        className="absolute top-4 right-4 w-24 h-24 z-5 rounded-full overflow-hidden border-2 border-green-400 sm:hidden"
        initial={{ y: 0 }}
        animate={{
          y: [0, -5, 0],
          rotate: [2, -2, 2]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        whileHover={{ scale: 1.1 }}
      >
        <img
          src="/noga.png"
          alt="Noga"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <animated.div style={fadeIn} className="container mx-auto py-12 px-4 relative z-10 overflow-auto flex-1">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-8"
        >
          <div className="flex flex-col items-center justify-center gap-6 mb-4">
            <h1
              className="wordart-outline text-center text-3xl"
              style={
                {
                  "--hue": colorScheme.complementaryHue,
                  "--saturation": `${colorScheme.baseSaturation}%`,
                  "--lightness": `${colorScheme.baseLightness}%`,
                  zIndex: 20,
                  position: "relative"
                } as React.CSSProperties
              }
            >
              {renderAnimatedTitle(`${format(currentMonth, "MMMM")} In the Soup`)}
            </h1>

            <div className="flex items-center justify-center gap-6">
              <Button
                className="retro-button relative overflow-hidden"
                onClick={handlePreviousMonth}
                disabled={isPreviousDisabled}
                style={{
                  boxShadow: `0 6px 0 #083f08, 0 8px 10px rgba(0,0,0,0.5)`,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease',
                  opacity: isPreviousDisabled ? 0.5 : 1,
                  cursor: isPreviousDisabled ? 'not-allowed' : 'pointer'
                }}
                onMouseDown={(e) => {
                  if (isPreviousDisabled) return;
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 2px 0 #083f08, 0 2px 5px rgba(0,0,0,0.5)';
                }}
                onMouseUp={(e) => {
                  if (isPreviousDisabled) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 #083f08, 0 8px 10px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  if (isPreviousDisabled) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 #083f08, 0 8px 10px rgba(0,0,0,0.5)';
                }}
              >
                <ChevronLeft className="h-5 w-5 mr-1" /> Previous
              </Button>

              <Button
                className="retro-button relative overflow-hidden"
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                style={{
                  boxShadow: `0 6px 0 #083f08, 0 8px 10px rgba(0,0,0,0.5)`,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease',
                  opacity: isNextDisabled ? 0.5 : 1,
                  cursor: isNextDisabled ? 'not-allowed' : 'pointer'
                }}
                onMouseDown={(e) => {
                  if (isNextDisabled) return;
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 2px 0 #083f08, 0 2px 5px rgba(0,0,0,0.5)';
                }}
                onMouseUp={(e) => {
                  if (isNextDisabled) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 #083f08, 0 8px 10px rgba(0,0,0,0.5)';
                }}
                onMouseLeave={(e) => {
                  if (isNextDisabled) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 0 #083f08, 0 8px 10px rgba(0,0,0,0.5)';
                }}
              >
                Next <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
          </div>

          <motion.div
            className="retro-screen overflow-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={
              {
                "--hue": colorScheme.baseHue,
                "--saturation": `${colorScheme.screenSaturation}%`,
                "--lightness": `${colorScheme.screenLightness}%`,
              } as React.CSSProperties
            }
          >
            <div className="text-center mb-8 relative z-10">
              <h2
                className="wordart-random mb-4"
                style={{ "--hue": colorScheme.complementaryHue } as React.CSSProperties}
              >
                Screenings
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <MapPin className="h-5 w-5 text-green-400" />
                <p className="text-lg text-green-400">Location annonced on the day</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              <AnimatePresence>
                {movies.map((movie, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="retro-card overflow-hidden">
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={movie.posterUrl || "/placeholder.svg"}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-4 relative">
                        <h3 className="font-semibold text-green-400 break-words" style={{
                          fontSize: movie.title.length > 30 ? '0.875rem' : movie.title.length > 20 ? '1rem' : '1.25rem'
                        }} title={movie.title}>{movie.title}</h3>
                        <p className="text-green-300">{movie.year}</p>
                        <div className="mt-2 pt-2 border-t border-green-700">
                          <p className="font-medium text-green-400">{format(parseISO(movie.date), "EEEE, MMMM d")}</p>
                          <p className="text-green-300">Dinner: 20:00 | Screening: 21:00</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </animated.div>

      {/* Original PNGs at bottom for larger screens */}
      <motion.div
        className="absolute bottom-4 left-4 w-64 h-auto z-5 hidden sm:block"
        initial={{ y: 0 }}
        animate={{
          y: [0, -8, 0],
          x: [0, -4, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ scale: 1.05, y: -15 }}
      >
        <img
          src="/eden.png"
          alt="Eden"
          className="w-full h-auto"
        />
      </motion.div>
      <motion.div
        className="absolute bottom-4 right-4 w-64 h-auto z-5 hidden sm:block"
        initial={{ y: 0 }}
        animate={{
          y: [0, -8, 0],
          x: [0, 4, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        whileHover={{ scale: 1.05, y: -15 }}
      >
        <img
          src="/noga.png"
          alt="Noga"
          className="w-full h-auto"
        />
      </motion.div>
    </div>
  )
}

