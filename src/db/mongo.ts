import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/movie-rest-api";
const isDebugMode = process.env.NODE_ENV !== "production" || process.env.DEBUG_MONGODB === "true";

const logMongoError = (message: string, error: unknown): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`${message}: ${errorMessage}`);

  if (isDebugMode) {
    console.error(error);
  }
};

mongoose.connection.on("error", (error) => {
  logMongoError("MongoDB connection error", error);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    logMongoError("Failed to connect to MongoDB", error);
    throw error;
  }
}

export async function closeDB(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

