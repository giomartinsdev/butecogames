import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { DEFAULT_AWAY_TIMEOUT } from "@butecogames/shared";
import { useSocketStore } from "@/stores/socketStore.js";
import type { UserSettingsResponse } from "@/api/user-settings.js";

const AWAY_KICK_PAGES = ["/games/roulette"];

export function useActivityTracker() {
  const socket = useSocketStore((s) => s.socket);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAwayRef = useRef(false);
  const kickedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef(
    queryClient.getQueryData<UserSettingsResponse>(["user-settings"])?.awayTimeout
      ?? DEFAULT_AWAY_TIMEOUT,
  );
  const socketRef = useRef(socket);
  const pathnameRef = useRef(pathname);
  const navigateRef = useRef(navigate);
  socketRef.current = socket;
  pathnameRef.current = pathname;
  navigateRef.current = navigate;

  const handleActivity = useCallback(() => {
    const s = socketRef.current;
    if (!s) return;
    if (kickedRef.current) return;
    if (isAwayRef.current) {
      isAwayRef.current = false;
      s.emit("presence:update_status", { status: "online" });
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isAwayRef.current) {
        isAwayRef.current = true;
        socketRef.current?.emit("presence:update_status", { status: "away" });
        if (AWAY_KICK_PAGES.includes(pathnameRef.current)) {
          kickedRef.current = true;
          navigateRef.current("/");
        }
      }
    }, timeoutRef.current * 1000);
  }, []);

  // Track page changes — also counts as activity
  useEffect(() => {
    if (!socket) return;
    socket.emit("presence:update_page", { page: pathname });
    if (!kickedRef.current) {
      handleActivity();
    }
  }, [socket, pathname, handleActivity]);

  // Track DOM activity (clicks, keydown, mousemove)
  useEffect(() => {
    if (!socket) return;

    let mouseMoveThrottle = 0;
    function handleMouseMove() {
      const now = Date.now();
      if (now - mouseMoveThrottle < 30_000) return;
      mouseMoveThrottle = now;
      kickedRef.current = false;
      handleActivity();
    }

    // Initial timer start
    handleActivity();

    function handleUserInput() {
      kickedRef.current = false;
      handleActivity();
    }

    document.addEventListener("click", handleUserInput);
    document.addEventListener("keydown", handleUserInput);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("click", handleUserInput);
      document.removeEventListener("keydown", handleUserInput);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [socket, handleActivity]);

  // Sync timeout from user-settings query when it loads
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === "updated" &&
        event.query.queryKey[0] === "user-settings" &&
        event.action.type === "success"
      ) {
        const data = event.query.state.data as UserSettingsResponse | undefined;
        if (data?.awayTimeout && data.awayTimeout !== timeoutRef.current) {
          timeoutRef.current = data.awayTimeout;
          handleActivity();
        }
      }
    });
    return unsubscribe;
  }, [queryClient, handleActivity]);

  // Listen for admin-changed timeout setting (live broadcast)
  useEffect(() => {
    if (!socket) return;

    const handleAwayTimeout = (data: { awayTimeout: number }) => {
      timeoutRef.current = data.awayTimeout;
      handleActivity();
    };

    socket.on("settings:away_timeout", handleAwayTimeout);
    return () => {
      socket.off("settings:away_timeout", handleAwayTimeout);
    };
  }, [socket, handleActivity]);
}
