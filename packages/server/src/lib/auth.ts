import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getMongoDb } from "../db/connection.js";
import { env } from "../config/env.js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

async function checkGuildMembership(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return false;
    const guilds = (await res.json()) as Array<{ id: string }>;
    return guilds.some((g) => g.id === env.DISCORD_GUILD_ID);
  } catch {
    return false;
  }
}

export function createAuth() {
  if (authInstance) return authInstance;

  const db = getMongoDb();

  authInstance = betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    socialProviders: {
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        scope: ["identify", "email", "guilds"],
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    trustedOrigins: [env.CLIENT_URL],
    hooks: {
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/callback/discord") return;

        const setCookie = ctx.context.responseHeaders?.get("set-cookie");
        if (!setCookie) return;

        // Extract session token from the set-cookie header
        const sessionMatch = setCookie.match(
          /better-auth\.session_token=([^;]+)/,
        );
        if (!sessionMatch) return;

        const sessionToken = decodeURIComponent(sessionMatch[1]);

        // Find the session to get the userId
        const session = await db.collection("session").findOne({
          token: sessionToken,
        });
        if (!session) return;

        const userId = session.userId.toString();

        // Get the Discord access token from the account collection
        const account = await db.collection("account").findOne({
          userId,
          providerId: "discord",
        });
        if (!account?.accessToken) return;

        const isMember = await checkGuildMembership(
          account.accessToken as string,
        );
        if (isMember) return;

        // Not a guild member — revoke session and redirect to login with error
        await db.collection("session").deleteOne({ token: sessionToken });

        return {
          response: Response.redirect(
            `${env.CLIENT_URL}/login?error=guild`,
            302,
          ),
        };
      }),
    },
  });

  return authInstance;
}

export function getAuth() {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call createAuth() first.");
  }
  return authInstance;
}
