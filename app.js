const express = require('express');
const crypto = require('node:crypto');
const cors = require('cors');
const movies = require('./movies.json');
const { validateMovie, validatePartialMovie } = require('./schemas/movies.js');

const app = express();
const PORT = process.env.PORT ?? 1234;
app.use(express.json()); //parseo de JSON
app.use(
  //middleware de cors
  cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:8080',
        'http://192.168.0.12:8080',
        'https://movies.com',
      ];

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.disable('x-powered-by');

app.get('/movies', (req, res) => {
  // const origin = req.header('origin');

  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin); //CORS: allow external origins
  // }

  const { genre } = req.query;
  if (genre) {
    let moviesByGenre = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase()),
    );
    return res.json(moviesByGenre);
  }
  res.json(movies);
});

app.get('/movies/:movieId', (req, res) => {
  const { id } = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) return res.json(movie);
  res.status(404).send('Movie not found');
});

app.post('/movies', (req, res) => {
  const validationResult = validateMovie(req.body);

  if (validationResult.error) {
    return res
      .status(400)
      .json({ error: JSON.parse(validationResult.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...validationResult.data,
  };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

app.delete('/movies/:id', (req, res) => {
  // const origin = req.header('origin');

  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin); //CORS: allow external origins
  // }
  const { id } = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex < 0) {
    res.status(404).json({ message: 'Movie not found' });
  }

  movies.splice(movieIndex, 1);

  return res.json({ mesage: 'Movie deleted' });
});

app.patch('/movies/:id', (req, res) => {
  const { id } = req.params;
  const result = validatePartialMovie(req.body);

  if (result.error) {
    return res.status(400).json({ message: JSON.parse(result.error.message) });
  }

  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex < 0) {
    return res.status(400).json({ message: 'Movie not found' });
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  };

  movies[movieIndex] = updateMovie;
  res.json(updateMovie);
});

// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS
// app.options('/movies/:id', (req, res) => {
//   const origin = req.header('origin');

//   if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
//     res.header('Access-Control-Allow-Origin', origin); //CORS: allow external origins
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
//   }
//   res.send(200);
// });

app.use((req, res) => {
  res.status(404).send('<h1>Not found</h1>');
});

app.listen(PORT, () => {
  console.log(`server listening on PORT http://localhost:${PORT}`);
});
