import http from "node:http";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connection.js";
import { createAuth } from "./lib/auth.js";
import { createApp } from "./app.js";
import { setupSocket } from "./socket/index.js";
import { autoCloseEvents } from "./services/event-betting.js";

async function main() {
  console.log("[Server] Starting Buteco Games server...");

  // 1. Connect to database
  await connectDatabase();

  // 2. Initialize Better Auth (needs DB connection)
  createAuth();

  // 3. Create Express app
  const app = createApp();

  // 4. Create HTTP server
  const httpServer = http.createServer(app);

  // 5. Setup Socket.io
  await setupSocket(httpServer);

  // 6. Start listening
  httpServer.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
  });

  // 7. Start sports betting auto-close scheduler (every minute)
  setInterval(async () => {
    try {
      await autoCloseEvents();
    } catch (error) {
      console.error("[Event Betting] Auto-close error:", error);
    }
  }, 60000); // 1 minute
}

main().catch((err) => {
  console.error("[Server] Failed to start:", err);
  process.exit(1);
});
