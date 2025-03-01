export interface Movie {
  title: string
  year: string
  posterUrl: string
  date: string // Specific date for the screening
}

export interface MonthlyMovies {
  [key: string]: Movie[] // Key is in the format "YYYY-MM"
}

export const moviesData: MonthlyMovies = {
  "2025-02": [
    {
      title: "The Killing of a Chinese Bookie",
      year: "1976",
      posterUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cc/The_Killing_of_a_Chinese_Bookie_Starring_Ben_Gazzara_%281976_poster_-_Style_A%29.jpg?height=500&width=350",
      date: "2025-02-04",
    },
    {
      title: "Wings of Desire",
      year: "1987",
      posterUrl: "https://dhftlfjula7qg.cloudfront.net/images/event/WING.jpg?height=500&width=350",
      date: "2025-02-11",
    },
    {
      title: "Buffalo '66",
      year: "1998",
      posterUrl: "https://moviesplusmadness.wordpress.com/wp-content/uploads/2015/01/buffalo-66-original.jpg?w=1172&h=1690?height=500&width=350",
      date: "2025-02-18",
    },
    {
      title: "Dirty Harry",
      year: "1971",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMzdhMTM2YTItOWU2YS00MTM0LTgyNDYtMDM1OWM3NzkzNTM2XkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_.jpg?height=500&width=350",
      date: "2025-02-25",
    },
  ],
  "2025-03": [
    {
      title: "Daddy Longlegs",
      year: "2009",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMjc0MDM2MDI4MF5BMl5BanBnXkFtZTgwMzk0ODM0NDE@._V1_.jpg?height=500&width=350",
      date: "2025-03-04",
    },
    {
      title: "O' Lucky Man",
      year: "1973",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMDkxZDQ4M2MtYTA0OC00YjE1LWEwZTMtNzA3ZGZiZTExNWJhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg?height=500&width=350",
      date: "2053-03-11",
    },
    {
      title: "They Shoot Horses, Don't They?",
      year: "1969",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMjUwNmFmMzQtNzAzOS00N2M4LWJlMzktYjZmZmY2MDliZTZhXkEyXkFqcGc@._V1_.jpg?height=500&width=350",
      date: "2025-03-18",
    },
    {
      title: "Fallen Angels",
      year: "1995",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMTc3NzI0MzQ3M15BMl5BanBnXkFtZTcwMzA0MDMzNA@@._V1_.jpg?height=500&width=350",
      date: "2025-03-25",
    },
  ],
}
