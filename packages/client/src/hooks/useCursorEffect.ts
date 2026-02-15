import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CURSOR_SETS, DEFAULT_CURSOR_SET_ID, DEFAULT_CURSOR_SIZE } from "@butecogames/shared";
import { useUserSettings } from "./useUserSettings.js";
import { useSocketStore } from "@/stores/socketStore.js";
import type { UserSettingsResponse } from "@/api/user-settings.js";

const STYLE_ELEMENT_ID = "buteco-custom-cursor";
const CURSOR_OVERLAY_ID = "buteco-cursor-overlay";

const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input[type="submit"], input[type="button"], select, label[for], .cursor-pointer';

function isGif(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".gif");
}

function resizeImageToDataUrl(src: string, size: number): Promise<string> {
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

function isInteractiveElement(el: Element | null): boolean {
  if (!el) return false;
  // Walk up the DOM to check if any parent is interactive
  let current: Element | null = el;
  while (current) {
    if (current.matches(INTERACTIVE_SELECTOR)) return true;
    current = current.parentElement;
  }
  return false;
}

/**
 * Sets up a JS-based cursor overlay for animated GIFs.
 * CSS cursor can't display GIFs larger than 128x128 and canvas
 * flattens animation, so we use a <div> that follows the mouse.
 */
function setupGifCursor(
  cursorUrl: string,
  pointerUrl: string | null,
  size: number,
): () => void {
  // Hide native cursor via CSS
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `*, *::before, *::after { cursor: none !important; }`;
  document.head.appendChild(style);

  // Create overlay element
  const overlay = document.createElement("div");
  overlay.id = CURSOR_OVERLAY_ID;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${size}px;
    height: ${size}px;
    pointer-events: none;
    z-index: 99999;
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url('${cursorUrl}');
    display: none;
  `;
  document.body.appendChild(overlay);

  let visible = false;

  function onMouseMove(e: MouseEvent) {
    if (!visible) {
      overlay.style.display = "block";
      visible = true;
    }
    overlay.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;

    // Swap image when hovering interactive elements
    if (pointerUrl) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const isPointer = isInteractiveElement(target);
      const expected = isPointer ? pointerUrl : cursorUrl;
      const current = overlay.dataset.src;
      if (current !== expected) {
        overlay.style.backgroundImage = `url('${expected}')`;
        overlay.dataset.src = expected;
      }
    }
  }

  function onMouseLeave() {
    overlay.style.display = "none";
    visible = false;
  }

  function onMouseEnter() {
    overlay.style.display = "block";
    visible = true;
  }

  overlay.dataset.src = cursorUrl;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseleave", onMouseLeave);
  document.addEventListener("mouseenter", onMouseEnter);

  return () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseleave", onMouseLeave);
    document.removeEventListener("mouseenter", onMouseEnter);
    overlay.remove();
    style.remove();
  };
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

  // Apply cursor
  useEffect(() => {
    const cursorSet = CURSOR_SETS.find((cs) => cs.id === cursorSetId);

    // Clean up previous cursor (both CSS and JS overlay)
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
    document.getElementById(CURSOR_OVERLAY_ID)?.remove();

    if (!cursorSet || (!cursorSet.cursorUrl && !cursorSet.pointerUrl)) return;

    const useJsCursor =
      (cursorSet.cursorUrl && isGif(cursorSet.cursorUrl)) ||
      (cursorSet.pointerUrl && isGif(cursorSet.pointerUrl));

    // GIFs: use JS overlay (CSS cursor can't animate GIFs > 128px)
    if (useJsCursor && cursorSet.cursorUrl) {
      const cleanup = setupGifCursor(
        cursorSet.cursorUrl,
        cursorSet.pointerUrl,
        cursorSize,
      );
      return cleanup;
    }

    // Static images: use CSS cursor with canvas resizing
    let cancelled = false;

    async function applyCssCursors() {
      const rules: string[] = [];

      if (cursorSet!.cursorUrl) {
        const dataUrl = await resizeImageToDataUrl(cursorSet!.cursorUrl, cursorSize);
        rules.push(
          `html, body { cursor: url('${dataUrl}'), auto !important; }`,
        );
      }

      if (cursorSet!.pointerUrl) {
        const dataUrl = await resizeImageToDataUrl(cursorSet!.pointerUrl, cursorSize);
        rules.push(
          `${INTERACTIVE_SELECTOR} { cursor: url('${dataUrl}'), pointer !important; }`,
        );
      }

      if (cancelled) return;

      const style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      style.textContent = rules.join("\n");
      document.head.appendChild(style);
    }

    applyCssCursors();

    return () => {
      cancelled = true;
      document.getElementById(STYLE_ELEMENT_ID)?.remove();
    };
  }, [cursorSetId, cursorSize]);
}
