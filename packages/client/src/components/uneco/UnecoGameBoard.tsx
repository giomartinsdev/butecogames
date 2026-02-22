import { useState } from "react";
import type { UnecoGameState, UnecoCardColor } from "@butecogames/shared";
import { UnecoHand } from "./UnecoHand.js";
import { UnecoPile } from "./UnecoPile.js";
import { UnecoOpponent } from "./UnecoOpponent.js";
import { UnecoTurnIndicator } from "./UnecoTurnIndicator.js";
import { UnecoColorPicker } from "./UnecoColorPicker.js";

interface UnecoGameBoardProps {
  gameState: UnecoGameState;
  userId: string;
  colorPickerOpen: boolean;
  onPlayCard: (cardId: string, chosenColor?: UnecoCardColor) => void;
  onDrawCard: () => void;
  onSayUneco: () => void;
  onForfeit: () => void;
  onOpenColorPicker: (cardId: string) => void;
  onCloseColorPicker: () => void;
  onSelectColor: (color: UnecoCardColor) => void;
}

export function UnecoGameBoard({
  gameState,
  userId,
  colorPickerOpen,
  onPlayCard,
  onDrawCard,
  onSayUneco,
  onForfeit,
  onOpenColorPicker,
  onCloseColorPicker,
  onSelectColor,
}: UnecoGameBoardProps) {
  const [showForfeitModal, setShowForfeitModal] = useState(false);

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

  // Show UNECO button when player has exactly 2 cards, it's their turn,
  // they haven't said UNECO yet, and they can actually play a card
  const showUnecoButton =
    myPlayer &&
    myPlayer.cardCount === 2 &&
    !myPlayer.saidUneco &&
    isMyTurn &&
    hasPlayableCard &&
    gameState.status === "playing";

  return (
    <div className="flex flex-col gap-4">
      {/* Opponents */}
      <div className="flex flex-wrap items-start justify-center gap-3">
        {opponents.map((player) => (
          <UnecoOpponent
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
      <UnecoTurnIndicator gameState={gameState} isMyTurn={isMyTurn} />

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
        <UnecoPile
          discardTop={gameState.discardTop}
          currentColor={gameState.currentColor}
          deckCount={gameState.deckCount}
          direction={gameState.direction}
          isMyTurn={isMyTurn}
          onDraw={onDrawCard}
          drawStack={gameState.drawStack}
        />
      </div>

      {/* UNECO button */}
      {showUnecoButton && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onSayUneco}
            className="animate-bounce rounded-full bg-yellow-500 px-6 py-2 text-lg font-extrabold text-black shadow-lg transition-transform hover:scale-110"
          >
            UNECO!
          </button>
        </div>
      )}

      {/* My hand */}
      <div className="border-t border-border pt-2">
        <UnecoHand
          hand={gameState.hand}
          gameState={gameState}
          isMyTurn={isMyTurn}
          onPlayCard={onPlayCard}
          onOpenColorPicker={onOpenColorPicker}
        />
      </div>

      {/* Color picker */}
      {colorPickerOpen && (
        <UnecoColorPicker
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

      {/* Forfeit button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setShowForfeitModal(true)}
          className="rounded-lg bg-destructive/10 px-4 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
        >
          Desistir
        </button>
      </div>

      {/* Forfeit confirmation modal */}
      {showForfeitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForfeitModal(false)} />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-card-foreground">Desistir da partida</h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Tem certeza que deseja desistir? Você perderá suas coins apostadas.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForfeitModal(false)}
                className="flex-1 rounded-lg bg-slate-700 px-4 py-2.5 font-medium text-muted-foreground transition hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForfeitModal(false);
                  onForfeit();
                }}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 font-medium text-destructive-foreground transition hover:bg-destructive/90"
              >
                Desistir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
