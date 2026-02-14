import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

let mongoClient: MongoClient;

export async function connectDatabase() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("[DB] Connected to MongoDB via Mongoose");

  mongoClient = new MongoClient(env.MONGODB_URI);
  await mongoClient.connect();
  console.log("[DB] Connected to MongoDB via native client (for Better Auth)");
}

export function getMongoClient(): MongoClient {
  if (!mongoClient) {
    throw new Error("MongoDB native client not initialized. Call connectDatabase() first.");
  }
  return mongoClient;
}

export function getMongoDb() {
  return getMongoClient().db();
}
