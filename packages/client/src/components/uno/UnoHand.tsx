import type { UnoCard as UnoCardType, UnoCardColor, UnoGameState } from "@butecogames/shared";
import { UnoCard } from "./UnoCard.js";

interface UnoHandProps {
  hand: UnoCardType[];
  gameState: UnoGameState;
  isMyTurn: boolean;
  onPlayCard: (cardId: string, chosenColor?: UnoCardColor) => void;
  onOpenColorPicker: (cardId: string) => void;
}

function isPlayable(
  card: UnoCardType,
  discardTop: UnoCardType | null,
  currentColor: UnoCardColor,
  drawStack: number,
): boolean {
  // When draw stack is active, only +2/+4 can be played to stack
  if (drawStack > 0) {
    return card.value === "+2" || card.value === "+4";
  }
  if (!discardTop) return true;
  if (card.color === "wild") return true;
  if (card.color === currentColor) return true;
  if (card.value === discardTop.value) return true;
  return false;
}

function sortHand(hand: UnoCardType[]): UnoCardType[] {
  const colorOrder = { red: 0, blue: 1, green: 2, yellow: 3, wild: 4 };
  return [...hand].sort((a, b) => {
    const ca = colorOrder[a.color] ?? 5;
    const cb = colorOrder[b.color] ?? 5;
    if (ca !== cb) return ca - cb;
    return a.value.localeCompare(b.value);
  });
}

export function UnoHand({
  hand,
  gameState,
  isMyTurn,
  onPlayCard,
  onOpenColorPicker,
}: UnoHandProps) {
  const sorted = sortHand(hand);

  const handleClick = (card: UnoCardType) => {
    if (!isMyTurn) return;
    if (!isPlayable(card, gameState.discardTop, gameState.currentColor, gameState.drawStack)) return;

    if (card.value === "wild" || card.value === "+4") {
      onOpenColorPicker(card.id);
    } else {
      onPlayCard(card.id);
    }
  };

  return (
    <div className="flex flex-wrap items-end justify-center gap-1 px-2 py-3">
      {sorted.map((card) => {
        const playable =
          isMyTurn &&
          isPlayable(card, gameState.discardTop, gameState.currentColor, gameState.drawStack);

        return (
          <div
            key={card.id}
            className={`transition-transform ${playable ? "" : ""}`}
          >
            <UnoCard
              card={card}
              size="lg"
              playable={playable}
              onClick={playable ? () => handleClick(card) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
