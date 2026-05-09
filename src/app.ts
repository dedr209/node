import cors from "cors";
import express from "express";

import { errorHandler } from "./middleware/errorHandler";
import { movieRouter } from "./routes/movie.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/movies", movieRouter);

app.use(errorHandler);

export { app };

