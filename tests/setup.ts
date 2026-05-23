import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer: MongoMemoryServer | null = null;

export async function startTestDB(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}

export async function stopTestDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearCollections(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const collectionName of Object.keys(collections)) {
      const collection = collections[collectionName];
      await collection.deleteMany({});
    }
  }
}

