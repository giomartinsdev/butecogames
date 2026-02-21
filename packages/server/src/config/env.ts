import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load .env from monorepo root
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../../../..");
config({ path: resolve(rootDir, ".env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: requireEnv("MONGODB_URI"),
  BETTER_AUTH_SECRET: requireEnv("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
  DISCORD_CLIENT_ID: requireEnv("DISCORD_CLIENT_ID"),
  DISCORD_CLIENT_SECRET: requireEnv("DISCORD_CLIENT_SECRET"),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DISCORD_GUILD_ID: requireEnv("DISCORD_GUILD_ID"),
  R2_ACCOUNT_ID: requireEnv("R2_ACCOUNT_ID"),
  R2_ACCESS_KEY_ID: requireEnv("R2_ACCESS_KEY_ID"),
  R2_SECRET_ACCESS_KEY: requireEnv("R2_SECRET_ACCESS_KEY"),
  R2_BUCKET_NAME: requireEnv("R2_BUCKET_NAME"),
  R2_PUBLIC_URL: requireEnv("R2_PUBLIC_URL"), // e.g. https://images.butecodosdevs.com
} as const;
