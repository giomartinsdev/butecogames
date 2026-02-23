import type { Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../lib/auth.js";
import { UserProfile } from "../models/UserProfile.js";

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    displayName: string;
    image: string;
    role: string;
  };
}

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const auth = getAuth();

    // Extract cookies from handshake headers
    const headers = new Headers();
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      return next(new Error("Authentication required"));
    }

    // Load or create profile
    let profile = await UserProfile.findOne({ userId: session.user.id });
    if (!profile) {
      profile = await UserProfile.create({
        userId: session.user.id,
        displayName: session.user.name,
      });
    }

    if (profile.banned) {
      return next(new Error("Conta banida"));
    }

    socket.data.userId = session.user.id;
    socket.data.displayName = profile.displayName;
    socket.data.image = session.user.image ?? "";
    socket.data.role = profile.role;
    next();
  } catch {
    next(new Error("Authentication failed"));
  }
}
