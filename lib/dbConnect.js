// utils/dbConnect.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env.local file");
}

// Global cache to avoid multiple connections during hot reloads
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(`${MONGODB_URI}/medimeet`, {
        bufferCommands: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};
