import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import { errorHandler } from "./middleware/errorHandler";
import { movieRouter } from "./routes/movie.routes";

const app = express();

app.get("/health", (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  const statusCode = isConnected ? 200 : 503;

  return res.status(statusCode).json({ status: isConnected ? "ok" : "unavailable" });
});

app.use(cors());
app.use(express.json());

app.use("/api/movies", movieRouter);

app.use(errorHandler);

export { app };

