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
  "2024-06": [
    {
      title: "Paris, Texas",
      year: "1984",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BNTFjZDAyOGEtYmM5Mi00MGY4LTg3NDAtNTkwMzQ4OTcwZGJlXkEyXkFqcGc@._V1_.jpg",
      date: "2024-06-17",
    },
    {
      title: "Box of Moonlight",
      year: "1996",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BZjJjYWIyNTYtOGU3Yy00MzJmLThhMDUtODU5OTBjOGJhMDFjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      date: "2024-06-24",
    },
  ],
  "2024-07": [
    {
      title: "Dogleg",
      year:" 2023",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMGM4NjhjN2UtMjEzNC00NTcxLWI0YjQtZjYyMWExNjVlZjdkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      date: "2024-07-09",
    },
    {
      title: "There Will Be Blood",
      year: "2007",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxODQ4MDU5NV5BMl5BanBnXkFtZTcwMDU4MjU1MQ@@._V1_FMjpg_UX1000_.jpg",
      date: "2024-07-16",
    },
    {
      title: "Hearts of Darkness: A Filmmaker's Apocalypse",
      year: "1991",
      posterUrl: "https://studiocloudstoragelive.blob.core.windows.net/campaigns/poster_024071.jpg?height=500&width=350",
      date: "2024-07-23",
    },
    {
      title: "Wild at Heart",
      year: "1990",
    posterUrl: "https://filmartgallery.com/cdn/shop/products/Wild-at-Heart-Vintage-Movie-Poster-Original.jpg?v=1738904883",
      date: "2024-07-31",
    },

  ],
  "2024-08": [
    {
      title: "Memories of Murder",
      year: "2003",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BYmRjOWE5NmMtYTdkYS00ODFlLWJiMTMtYzE2NDZlZjlkZDQ0XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg?height=500&width=350",
      date: "2024-08-06",
    },
    {
      title: "All the President's Men",
      year: "1976",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BZGQzMzcwMDYtMmNjNS00YzZlLTg2MjUtNTE0MThlNTFjMDQ0XkEyXkFqcGc@._V1_.jpg?height=500&width=350",
      date: "2024-08-21",
    },
    {
      title: "Short Cuts",
      year: "1993",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BYThkMTY5ZTgtYzc0Yy00MTZiLWE5YjUtMDAwM2E4Yjg5MmM5XkEyXkFqcGc@._V1_.jpg?height=500&width=350",
      date: "2024-08-27",
    },

  ],
  "2024-09": [
    {
      title: "Big Trouble in Little China",
      year: "1986",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/7/76/Big_Trouble_in_Little_China_Film_Poster.jpg?height=500&width=350",
      date: "2024-09-03",
    },
    {
      title: "Videodrome",
      year: "1983",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BOTI0NDVlMjMtNWI5Yi00ZWM0LTg4NWUtNGRkYjU5NTBkZjVkXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg?height=500&width=350",
      date: "2024-09-10",
    },
    {
      title: "A Woman Under the Influence",
      year: "1974",
      posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSz1eClQTlPjqudQmIOSIkHJMi9KfGRrNQzWQ&s?height=500&width=350",
      date: "2024-09-17",
    },
    {
      title: "Kinds of Kindness",
      year: "2024",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMjZmZGY1MzMtNDVkNi00NjE2LTlkMzMtMmUzNWExY2ExZWI2XkEyXkFqcGc@._V1_QL75_UX190_CR0,2,190,281_.jpg?height=500&width=350",
      date: "2024-09-24",
    },
  ],
  "2024-10": [
    {
      title: "Comfortably Numb",
      year: "1991",
      posterUrl: "https://www.edb.co.il/photos/3401991_poster02.poster.jpg?height=500&width=350",
      date: "2024-10-01",
    },
    {
      title: "Fitzcarraldo",
      year: "1982",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BYzJjNTRkNjUtZGE4MC00YmRlLWI0ODYtMzJjNGZkYWMzNTJhXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg?height=500&width=350",
      date: "2024-10-08",
    },
    {
      title: "Sexy Beast",
      year: "2000",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/9/90/Sexy_beast_ver1.jpg?height=500&width=350",
      date: "2024-10-15",
    },
    {
      title: "La Haine",
      year: "1995",
      posterUrl: "https://cdn.posteritati.com/posters/000/000/063/268/la-haine-md-web.jpg?height=500&width=350",
      date: "2024-10-22",
    },
    {
      title: "Nashville",
      year: "1975",
      posterUrl: "https://m.media-amazon.com/images/I/618WL2nqYjL._AC_UF894,1000_QL80_.jpg?height=500&width=350",
      date: "2024-11-29",
    },

  ],
  "2024-11": [
    {
      title: "Sypmathy for Lady Vengeance",
      year: "2005",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMDQ4MDM4YjEtN2E3Yy00NDJjLTgzNWUtN2M4ZTVkMGEzMzhiXkEyXkFqcGc@._V1_.jpg?height=500&width=350",
      date: "2024-11-12",
    },
    {
      title: "El Sur",
      year: "1983",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/0/08/The_South_%28film%29.jpg?height=500&width=350",
      date: "2024-11-19",
    },
    {
      title: "The State of Things",
      year: "1982",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BMTQyMzE4MjgwMV5BMl5BanBnXkFtZTgwOTEyMzkwMzE@._V1_FMjpg_UX1000_.jpg?height=500&width=350",
      date: "2024-11-26",
    },
  ],
  "2024-12": [
    {
      title: "The Searchers",
      year: "1956",
      posterUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SearchersPoster-BillGold.jpg/640px-SearchersPoster-BillGold.jpg?height=500&width=350",
      date: "2024-12-03",
    },
    {
      title: "Santa Sangre",
      year: "1989",
      posterUrl: "https://m.media-amazon.com/images/I/81f4KiF2YrL._AC_UF894,1000_QL80_.jpg?height=500&width=350",
      date: "2024-12-10",
    },
  ],
  "2025-01": [
    {
      title: "Stranger Than Paradise",
      year: "1984",
      posterUrl: "https://s3.amazonaws.com/criterion-production/films/7da214a5a5d94a222785c8dd5c257e57/85da9M3NwHvtnIvj6oK2ovJjtYOTX8_original.jpg?height=500&width=350",
      date: "2025-01-07",
    },
    {
      title: "Boogie Nights",
      year: "1997",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BOTFmZmE4OTMtNDYxNi00MmZmLThlYjktMmExMzMwY2YzOTFiXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      date: "2025-01-14",
    },
    {
      title: "The Player",
      year: "1992",
      posterUrl: "https://s3.amazonaws.com/criterion-production/films/0766da8ab2f5ffe38ca8fd231325b8f5/kAANocS3Pmyr9DXkivKYnVP0FH1Yjm_large.jpg?height=500&width=350",
      date: "2025-01-21",
    },
    {
      title: "All That Jazz",
      year: "1979",
      posterUrl: "https://s3.amazonaws.com/criterion-production/films/8ee8b30fd8b04c0925a571a6aa83551b/AMKYaHIhWGuRsN3wZvDOZojSyG2ZaD_original.jpg?height=500&width=350",
      date: "2025-01-28",
    },
  ],
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
  "2025-04": [
    {
      title: "3 Colours: Blue", 
      year: "1993",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BNWMxNWE2NGYtMzYwOS00NmJhLTgwNjAtNGM3ODIwNjU5MTZiXkEyXkFqcGc@._V1_.jpg",
      date: "2025-04-02",
    },
    {
      title: "Red Desert",
      year: "1964",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BOGI2YzgyNjgtNDcxZi00ZTVjLThhMDAtMTdlYTBlNmIxYzExXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      date: "2025-04-08",
    },
    {
      title: "True Romance",
      year: "1993",
      posterUrl: "https://m.media-amazon.com/images/M/MV5BYzQ5OGMwMDAtMzcyOS00YTA4LWEwM2MtOTA1MDZjZGEyYmI1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
      date: "2025-04-15",
    },
    {
     title: "Right Around Midnight", 
     year: "1996",
     posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJPDY_FLTUfQqpk6NMRWGjGILf518BV4IO_Q&s",
     date: "2025-04-22",
    },
  ],
  "2025-05": [
    {
      title: "Shadows in Paradise",
      year: "1996",
      posterUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTOU2itUMlsTTWssoxhNcv8DnuVmZkK1BDYA&s",
      date: "2025-05-06",
    },
    {
      title: "The Fall",
      year: "2006",
      posterUrl: "https://upload.wikimedia.org/wikipedia/en/2/26/Fall_ver2.jpg",
      date: "2025-05-13",
    },
    {
      title: "Tokyo!",
      year: "2008",
      posterUrl: "https://resizing.flixster.com/D2Dkf2k2sX4IX8bcvVYYflQjGms=/fit-in/705x460/v2/https://resizing.flixster.com/LzxtMnakV6f5Y1CuT_oGY5CWaTU=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzVlY2ZkYzYyLTgyZDQtNDZkOC1hYzA0LTA5YzEwZjQ1ZGI2ZC53ZWJw",
      date: "2025-05-20",
    }
  ]
}
