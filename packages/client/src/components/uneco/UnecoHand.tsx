import { useState } from "react";
import type { UnecoCard as UnecoCardType, UnecoCardColor, UnecoGameState, AnyCardColor } from "@butecogames/shared";
import { UNECO_COLOR_HEX } from "@butecogames/shared";

interface UnecoHandProps {
  hand: UnecoCardType[];
  gameState: UnecoGameState;
  isMyTurn: boolean;
  onPlayCard: (cardId: string, chosenColor?: UnecoCardColor) => void;
  onOpenColorPicker: (cardId: string) => void;
}

function isPlayable(
  card: UnecoCardType,
  discardTop: UnecoCardType | null,
  currentColor: UnecoCardColor,
  drawStack: number,
): boolean {
  if (drawStack > 0) {
    return card.value === "+2" || card.value === "+4";
  }
  if (!discardTop) return true;
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === discardTop.value) return true;
  return false;
}

function sortHand(hand: UnecoCardType[]): UnecoCardType[] {
  const colorOrder = { red: 0, blue: 1, green: 2, yellow: 3, wild: 4 };
  return [...hand].sort((a, b) => {
    const ca = colorOrder[a.color] ?? 5;
    const cb = colorOrder[b.color] ?? 5;
    if (ca !== cb) return ca - cb;
    return a.value.localeCompare(b.value);
  });
}

const VALUE_DISPLAY: Record<string, string> = {
  skip: "⊘",
  reverse: "⟲",
  "+2": "+2",
  wild: "★",
  "+4": "+4",
};

function getCardBg(color: AnyCardColor): string {
  if (color === "wild") {
    return "bg-gradient-to-br from-red-500 via-blue-500 to-green-500";
  }
  return "";
}

/** Width of the visible sliver for overlapping cards */
const CARD_PEEK_WIDTH = 28;
/** Full card width */
const CARD_WIDTH = 80;
/** Card height */
const CARD_HEIGHT = 112;

export function UnecoHand({
  hand,
  gameState,
  isMyTurn,
  onPlayCard,
  onOpenColorPicker,
}: UnecoHandProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sorted = sortHand(hand);

  const handleClick = (card: UnecoCardType) => {
    if (!isMyTurn) return;
    if (!isPlayable(card, gameState.discardTop, gameState.currentColor, gameState.drawStack)) return;

    if (card.value === "wild" || card.value === "+4") {
      onOpenColorPicker(card.id);
    } else {
      onPlayCard(card.id);
    }
  };

  // Calculate total hand width: (N-1) * CARD_PEEK_WIDTH + CARD_WIDTH
  const totalWidth = sorted.length > 0
    ? (sorted.length - 1) * CARD_PEEK_WIDTH + CARD_WIDTH
    : 0;

  return (
    <div className="flex justify-center px-2 py-3">
      <div className="relative" style={{ width: totalWidth, height: CARD_HEIGHT + 16 }}>
        {sorted.map((card, idx) => {
          const playable =
            isMyTurn &&
            isPlayable(card, gameState.discardTop, gameState.currentColor, gameState.drawStack);
          const isLast = idx === sorted.length - 1;
          const isHovered = hoveredId === card.id;
          const display = VALUE_DISPLAY[card.value] ?? card.value;
          const bgClass = getCardBg(card.color);
          const bgColor = card.color !== "wild" ? (UNECO_COLOR_HEX[card.color] ?? "#666") : undefined;

          return (
            <button
              key={card.id}
              type="button"
              onClick={playable ? () => handleClick(card) : undefined}
              disabled={!playable}
              onMouseEnter={() => setHoveredId(card.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                absolute top-0 border-2 font-bold text-white shadow-md select-none
                rounded-lg transition-all duration-150
                ${bgClass}
                ${playable
                  ? "border-white/80 cursor-pointer ring-2 ring-white/40"
                  : "border-white/20 cursor-default"
                }
              `}
              style={{
                left: idx * CARD_PEEK_WIDTH,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                backgroundColor: bgColor,
                zIndex: idx,
                transform: isHovered ? "translateY(-12px)" : "translateY(0)",
              }}
            >
              {/* Top-left value (always visible in the peek sliver) */}
              <span className="absolute top-1 left-1.5 text-sm font-bold drop-shadow">
                {display}
              </span>
              {/* Full card face (visible on last card or when hovered) */}
              {(isLast || isHovered) && (
                <>
                  <span className="flex h-full items-center justify-center text-xl font-extrabold drop-shadow-md">
                    {display}
                  </span>
                  <span className="absolute bottom-0.5 right-1 rotate-180 text-[0.6em] font-semibold drop-shadow">
                    {display}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
