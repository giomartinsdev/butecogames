import type { UnoGameState, UnoCardColor } from "@butecogames/shared";
import { UnoHand } from "./UnoHand.js";
import { UnoPile } from "./UnoPile.js";
import { UnoOpponent } from "./UnoOpponent.js";
import { UnoTurnIndicator } from "./UnoTurnIndicator.js";
import { UnoColorPicker } from "./UnoColorPicker.js";

interface UnoGameBoardProps {
  gameState: UnoGameState;
  userId: string;
  colorPickerOpen: boolean;
  onPlayCard: (cardId: string, chosenColor?: UnoCardColor) => void;
  onDrawCard: () => void;
  onSayUno: () => void;
  onOpenColorPicker: (cardId: string) => void;
  onCloseColorPicker: () => void;
  onSelectColor: (color: UnoCardColor) => void;
}

export function UnoGameBoard({
  gameState,
  userId,
  colorPickerOpen,
  onPlayCard,
  onDrawCard,
  onSayUno,
  onOpenColorPicker,
  onCloseColorPicker,
  onSelectColor,
}: UnoGameBoardProps) {
  const myPlayerIndex = gameState.players.findIndex(
    (p) => p.userId === userId,
  );
  const isMyTurn = myPlayerIndex === gameState.currentPlayerIndex;
  const myPlayer = gameState.players[myPlayerIndex];

  // Get opponents (everyone except me)
  const opponents = gameState.players.filter((p) => p.userId !== userId);

  // Check if the player has at least one playable card
  const hasPlayableCard = isMyTurn && gameState.hand.some((card) => {
    if (gameState.drawStack > 0) return card.value === "+2" || card.value === "+4";
    if (!gameState.discardTop) return true;
    if (card.color === "wild") return true;
    if (card.color === gameState.currentColor) return true;
    if (card.value === gameState.discardTop.value) return true;
    return false;
  });

  // Show UNO button when player has exactly 2 cards, it's their turn,
  // they haven't said UNO yet, and they can actually play a card
  const showUnoButton =
    myPlayer &&
    myPlayer.cardCount === 2 &&
    !myPlayer.saidUno &&
    isMyTurn &&
    hasPlayableCard &&
    gameState.status === "playing";

  return (
    <div className="flex flex-col gap-4">
      {/* Opponents */}
      <div className="flex flex-wrap items-start justify-center gap-3">
        {opponents.map((player) => (
          <UnoOpponent
            key={player.userId}
            player={player}
            isCurrentTurn={
              gameState.players[gameState.currentPlayerIndex]?.userId ===
              player.userId
            }
          />
        ))}
      </div>

      {/* Turn indicator */}
      <UnoTurnIndicator gameState={gameState} isMyTurn={isMyTurn} />

      {/* Draw stack indicator */}
      {gameState.drawStack > 0 && (
        <div className="flex justify-center">
          <div className="rounded-lg bg-destructive/20 px-4 py-2 text-center">
            <span className="text-sm font-bold text-destructive">
              +{gameState.drawStack} acumulado!
              {isMyTurn && " Jogue +2/+4 ou compre"}
            </span>
          </div>
        </div>
      )}

      {/* Center: Pile */}
      <div className="flex items-center justify-center py-4">
        <UnoPile
          discardTop={gameState.discardTop}
          currentColor={gameState.currentColor}
          deckCount={gameState.deckCount}
          direction={gameState.direction}
          isMyTurn={isMyTurn}
          onDraw={onDrawCard}
          drawStack={gameState.drawStack}
        />
      </div>

      {/* UNO button */}
      {showUnoButton && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onSayUno}
            className="animate-bounce rounded-full bg-yellow-500 px-6 py-2 text-lg font-extrabold text-black shadow-lg transition-transform hover:scale-110"
          >
            UNO!
          </button>
        </div>
      )}

      {/* My hand */}
      <div className="border-t border-border pt-2">
        <UnoHand
          hand={gameState.hand}
          gameState={gameState}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
          onOpenColorPicker={onOpenColorPicker}
        />
      </div>

      {/* Color picker */}
      {colorPickerOpen && (
        <UnoColorPicker
          onSelect={onSelectColor}
          onCancel={onCloseColorPicker}
        />
      )}

      {/* Spectator count */}
      {gameState.spectatorCount > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          {gameState.spectatorCount} espectador{gameState.spectatorCount > 1 ? "es" : ""}
        </div>
      )}
    </div>
  );
}
