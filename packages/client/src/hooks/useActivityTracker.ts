import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { DEFAULT_AWAY_TIMEOUT } from "@butecogames/shared";
import { useSocketStore } from "@/stores/socketStore.js";

export function useActivityTracker() {
  const socket = useSocketStore((s) => s.socket);
  const { pathname } = useLocation();
  const isAwayRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef(DEFAULT_AWAY_TIMEOUT);
  const socketRef = useRef(socket);
  socketRef.current = socket;

  const handleActivity = useCallback(() => {
    const s = socketRef.current;
    if (!s) return;
    if (isAwayRef.current) {
      isAwayRef.current = false;
      s.emit("presence:update_status", { status: "online" });
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!isAwayRef.current) {
        isAwayRef.current = true;
        socketRef.current?.emit("presence:update_status", { status: "away" });
      }
    }, timeoutRef.current * 1000);
  }, []);

  // Track page changes — also counts as activity
  useEffect(() => {
    if (!socket) return;
    socket.emit("presence:update_page", { page: pathname });
    handleActivity();
  }, [socket, pathname, handleActivity]);

  // Track DOM activity (clicks, keydown, mousemove)
  useEffect(() => {
    if (!socket) return;

    let mouseMoveThrottle = 0;
    function handleMouseMove() {
      const now = Date.now();
      if (now - mouseMoveThrottle < 30_000) return;
      mouseMoveThrottle = now;
      handleActivity();
    }

    // Initial timer start
    handleActivity();

    document.addEventListener("click", handleActivity);
    document.addEventListener("keydown", handleActivity);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener("click", handleActivity);
      document.removeEventListener("keydown", handleActivity);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [socket, handleActivity]);

  // Listen for admin-changed timeout setting
  useEffect(() => {
    if (!socket) return;

    const handleAwayTimeout = (data: { awayTimeout: number }) => {
      timeoutRef.current = data.awayTimeout;
    };

    socket.on("settings:away_timeout", handleAwayTimeout);
    return () => {
      socket.off("settings:away_timeout", handleAwayTimeout);
    };
  }, [socket]);
}
