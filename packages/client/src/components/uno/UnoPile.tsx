import type { UnoCard as UnoCardType, UnoCardColor, UnoDirection } from "@butecogames/shared";
import { UNO_COLOR_HEX } from "@butecogames/shared";
import { UnoCard } from "./UnoCard.js";

interface UnoPileProps {
  discardTop: UnoCardType | null;
  currentColor: UnoCardColor;
  deckCount: number;
  direction: UnoDirection;
  isMyTurn: boolean;
  onDraw: () => void;
  drawStack?: number;
}

export function UnoPile({
  discardTop,
  currentColor,
  deckCount,
  direction,
  isMyTurn,
  onDraw,
  drawStack = 0,
}: UnoPileProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Draw pile */}
      <button
        type="button"
        onClick={onDraw}
        disabled={!isMyTurn}
        className={`
          relative flex h-28 w-20 items-center justify-center rounded-lg
          border-2 bg-gray-700 font-bold text-white shadow-lg transition-all
          ${isMyTurn
            ? "border-primary cursor-pointer hover:scale-105 hover:shadow-primary/30"
            : "border-white/20 cursor-default"
          }
        `}
      >
        <div className="text-center">
          <div className="text-2xl">🂠</div>
          {drawStack > 0 && isMyTurn ? (
            <div className="text-xs font-bold text-destructive">+{drawStack}</div>
          ) : (
            <div className="text-xs text-gray-300">{deckCount}</div>
          )}
        </div>
      </button>

      {/* Discard pile + color indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {discardTop ? (
            <UnoCard card={discardTop} size="lg" />
          ) : (
            <div className="flex h-28 w-20 items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-muted-foreground">
              —
            </div>
          )}
        </div>

        {/* Current color indicator */}
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 rounded-full border-2 border-white/40 shadow"
            style={{ backgroundColor: UNO_COLOR_HEX[currentColor] }}
          />
          <span className="text-xs text-muted-foreground">
            {direction === "clockwise" ? "→" : "←"}
          </span>
        </div>
      </div>
    </div>
  );
}
