import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CURSOR_SETS, DEFAULT_CURSOR_SET_ID, DEFAULT_CURSOR_SIZE } from "@butecogames/shared";
import { useUserSettings } from "./useUserSettings.js";
import { useSocketStore } from "@/stores/socketStore.js";
import type { UserSettingsResponse } from "@/api/user-settings.js";

const STYLE_ELEMENT_ID = "buteco-custom-cursor";

function isGif(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".gif");
}

/**
 * For static images (PNG, etc.): resize via canvas and return a data URL.
 * For GIFs: return the original URL so the browser renders the animation natively.
 * (Canvas flattens GIF animation to a single frame, so we skip resizing for GIFs.)
 */
function getCursorUrl(src: string, size: number): Promise<string> {
  if (isGif(src)) {
    return Promise.resolve(src);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load cursor image: ${src}`));
    img.src = src;
  });
}

export function useCursorEffect() {
  const { data } = useUserSettings();
  const cursorSetId = data?.settings?.cursorSetId ?? DEFAULT_CURSOR_SET_ID;
  const cursorSize = data?.cursorSize ?? DEFAULT_CURSOR_SIZE;
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();

  // Listen for real-time cursor size updates from admin
  useEffect(() => {
    if (!socket) return;

    function onCursorSize({ cursorSize }: { cursorSize: number }) {
      queryClient.setQueryData<UserSettingsResponse>(
        ["user-settings"],
        (old) => old ? { ...old, cursorSize } : undefined,
      );
    }

    socket.on("settings:cursor_size", onCursorSize);
    return () => {
      socket.off("settings:cursor_size", onCursorSize);
    };
  }, [socket, queryClient]);

  // Apply cursor CSS
  useEffect(() => {
    const cursorSet = CURSOR_SETS.find((cs) => cs.id === cursorSetId);

    // Remove existing custom cursor style
    const existing = document.getElementById(STYLE_ELEMENT_ID);
    if (existing) existing.remove();

    // If browser default or unknown set, done
    if (!cursorSet || (!cursorSet.cursorUrl && !cursorSet.pointerUrl)) return;

    let cancelled = false;

    async function applyCursors() {
      const rules: string[] = [];

      if (cursorSet!.cursorUrl) {
        const dataUrl = await getCursorUrl(cursorSet!.cursorUrl, cursorSize);
        rules.push(
          `html, body { cursor: url('${dataUrl}'), auto !important; }`,
        );
      }

      if (cursorSet!.pointerUrl) {
        const dataUrl = await getCursorUrl(cursorSet!.pointerUrl, cursorSize);
        rules.push(
          `a, button, [role="button"], input[type="submit"], input[type="button"], select, label[for], .cursor-pointer { cursor: url('${dataUrl}'), pointer !important; }`,
        );
      }

      if (cancelled) return;

      const style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      style.textContent = rules.join("\n");
      document.head.appendChild(style);
    }

    applyCursors();

    return () => {
      cancelled = true;
      const el = document.getElementById(STYLE_ELEMENT_ID);
      if (el) el.remove();
    };
  }, [cursorSetId, cursorSize]);
}
