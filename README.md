# Movie REST API

A TypeScript Express.js REST API for managing movies with MongoDB.

## Quick Start

### Install & Setup

```bash
npm install
```

Create `.env`:
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=Cluster0
PORT=3000
```

### Run

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

### Test

```bash
npm test
```

(Tests use in-memory MongoDB, no external DB needed.)

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/movies` | Create movie |
| GET | `/api/movies?page=1&limit=10&genre=Drama&sortBy=releaseYear&sortOrder=asc` | List (with filters, sorting, pagination) |
| GET | `/api/movies/:id` | Get by ID |
| PATCH | `/api/movies/:id` | Update |
| DELETE | `/api/movies/:id` | Delete |
| GET | `/api/movies/top-rated` | Movies with releaseYear > 2020 |

## Create Movie

```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{"title":"Dune","genre":"Action","releaseYear":2021}'
```

## Stack

- Express.js, Mongoose, Zod, TypeScript, Jest, SuperTest, MongoDB

