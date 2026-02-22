import { useEffect, useRef, useState, useMemo } from "react";
import type { UnecoCard as UnecoCardType, UnecoCardColor, UnecoDirection } from "@butecogames/shared";
import { UNECO_COLOR_HEX } from "@butecogames/shared";
import { UnecoCard } from "./UnecoCard.js";

interface DiscardEntry {
  card: UnecoCardType;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

interface UnecoPileProps {
  discardTop: UnecoCardType | null;
  currentColor: UnecoCardColor;
  deckCount: number;
  direction: UnecoDirection;
  isMyTurn: boolean;
  onDraw: () => void;
  drawStack?: number;
}

const MAX_PILE_SIZE = 10;

export function UnecoPile({
  discardTop,
  currentColor,
  deckCount,
  direction,
  isMyTurn,
  onDraw,
  drawStack = 0,
}: UnecoPileProps) {
  const [pileHistory, setPileHistory] = useState<DiscardEntry[]>([]);
  const prevDiscardIdRef = useRef<string | null>(null);

  // Track changes to discardTop and build pile history
  useEffect(() => {
    if (!discardTop) return;
    if (discardTop.id === prevDiscardIdRef.current) return;

    prevDiscardIdRef.current = discardTop.id;

    const entry: DiscardEntry = {
      card: discardTop,
      rotation: Math.random() * 60 - 30, // -30° to +30°
      offsetX: Math.random() * 12 - 6, // -6px to +6px
      offsetY: Math.random() * 12 - 6,
    };

    setPileHistory((prev) => {
      const next = [...prev, entry];
      if (next.length > MAX_PILE_SIZE) {
        return next.slice(next.length - MAX_PILE_SIZE);
      }
      return next;
    });
  }, [discardTop]);

  // Random rotations for draw pile backing cards
  const drawPileRotations = useMemo(() => [
    { rotation: -3, offsetX: -1, offsetY: 1 },
    { rotation: 5, offsetX: 2, offsetY: -1 },
  ], []);

  return (
    <div className="flex items-center gap-8">
      {/* Draw pile */}
      <button
        type="button"
        onClick={onDraw}
        disabled={!isMyTurn}
        className="relative"
        style={{ width: 80, height: 112 }}
      >
        {/* Backing cards for depth */}
        {drawPileRotations.map((r, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-lg border-2 border-white/10 bg-gray-800"
            style={{
              transform: `rotate(${r.rotation}deg) translate(${r.offsetX}px, ${r.offsetY}px)`,
              zIndex: i,
            }}
          />
        ))}
        {/* Top card */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center rounded-lg
            border-2 bg-gray-700 font-bold text-white shadow-lg transition-all
            ${isMyTurn
              ? "border-primary cursor-pointer hover:scale-105 hover:shadow-primary/30"
              : "border-white/20 cursor-default"
            }
          `}
          style={{ zIndex: 2 }}
        >
          <div className="text-center">
            <div className="text-2xl">🂠</div>
            {drawStack > 0 && isMyTurn ? (
              <div className="text-xs font-bold text-destructive">+{drawStack}</div>
            ) : (
              <div className="text-xs text-gray-300">{deckCount}</div>
            )}
          </div>
        </div>
      </button>

      {/* Discard pile with history */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative" style={{ width: 80, height: 112 }}>
          {pileHistory.length === 0 && !discardTop && (
            <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-muted-foreground">
              —
            </div>
          )}

          {/* Render pile history with random rotations */}
          {pileHistory.map((entry, idx) => (
            <div
              key={`${entry.card.id}-${idx}`}
              className="absolute inset-0"
              style={{
                zIndex: idx,
                transform: `rotate(${entry.rotation}deg) translate(${entry.offsetX}px, ${entry.offsetY}px)`,
              }}
            >
              <UnecoCard card={entry.card} size="lg" />
            </div>
          ))}
        </div>

        {/* Current color indicator */}
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-full border-2 border-white/40 shadow"
            style={{ backgroundColor: UNECO_COLOR_HEX[currentColor] }}
          />
          <span className="text-xs text-muted-foreground">
            {direction === "clockwise" ? "→" : "←"}
          </span>
        </div>
      </div>
    </div>
  );
}
