import { app } from "./app";
import { closeDB, connectDB } from "./db/mongo";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    process.on("SIGTERM", () => {
      void (async () => {
        await closeDB();
        server.close(() => process.exit(0));
      })();
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1);
  }
};

void startServer();

