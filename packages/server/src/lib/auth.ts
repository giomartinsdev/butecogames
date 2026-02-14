import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getMongoDb } from "../db/connection.js";
import { env } from "../config/env.js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function createAuth() {
  if (authInstance) return authInstance;

  authInstance = betterAuth({
    database: mongodbAdapter(getMongoDb()),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    socialProviders: {
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [env.CLIENT_URL],
  });

  return authInstance;
}

export function getAuth() {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call createAuth() first.");
  }
  return authInstance;
}
