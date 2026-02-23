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

/**
 * Calculate position on a horizontal oval for opponent placement.
 * Distributes opponents evenly along the arc excluding the bottom (current player position).
 */
function getOvalPosition(index: number, total: number) {
  // Distribute along the top arc: from 210° clockwise through top to 330°
  // 0° = top, 90° = right, 180° = bottom, 270° = left
  const step = 300 / (total + 1);
  const angleDeg = (210 + step * (index + 1)) % 360;
  const angleRad = (angleDeg * Math.PI) / 180;

  // sin gives x, -cos gives y (0°=top)
  const x = Math.sin(angleRad);
  const y = -Math.cos(angleRad);

  return {
    left: `${50 + x * 42}%`,
    top: `${42 + y * 36}%`,
  };
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

  // Get opponents in turn order starting from the player right after me.
  // This ensures the next player clockwise is always in the same position.
  // Spectators see all players (they have no seat).
  const opponents = (() => {
    const all = gameState.players;
    if (myPlayerIndex === -1) return all;
    const ordered: typeof all = [];
    for (let i = 1; i < all.length; i++) {
      ordered.push(all[(myPlayerIndex + i) % all.length]);
    }
    return ordered;
  })();

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
    <div className="flex flex-col gap-2">
      {/* Table area: oval layout with opponents around center piles */}
      <div className="relative mx-auto w-full max-w-3xl" style={{ minHeight: "380px" }}>
        {/* Animated border + glow (::after = border, ::before = glow) */}
        <div
          className="uneco-table-border"
          data-reverse={gameState.direction === "counterclockwise" ? "" : undefined}
        >

          {/* Opponents positioned around the oval */}
          {opponents.map((player, idx) => {
            const pos = getOvalPosition(idx, opponents.length);
            return (
              <div
                key={player.userId}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.left, top: pos.top }}
              >
                <UnecoOpponent
                  player={player}
                  isCurrentTurn={
                    gameState.players[gameState.currentPlayerIndex]?.userId ===
                    player.userId
                  }
                />
              </div>
            );
          })}

          {/* Turn indicator at bottom center (my seat) */}
          {gameState.players[gameState.currentPlayerIndex] && (
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: "4px" }}
            >
              <UnecoTurnIndicator gameState={gameState} isMyTurn={isMyTurn} />
            </div>
          )}

          {/* Center: Piles + indicators */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center gap-2">
              {/* Draw stack indicator */}
              {gameState.drawStack > 0 && (
                <div className="rounded-lg bg-destructive/20 px-3 py-1 text-center">
                  <span className="text-xs font-bold text-destructive">
                    +{gameState.drawStack} acumulado!
                    {isMyTurn && " Jogue +2/+4 ou compre"}
                  </span>
                </div>
              )}

              {/* Draw & Discard piles */}
              <UnecoPile
                discardTop={gameState.discardTop}
                currentColor={gameState.currentColor}
                direction={gameState.direction}
                isMyTurn={isMyTurn}
                onDraw={onDrawCard}
                drawStack={gameState.drawStack}
              />

              {/* UNECO button */}
              {showUnecoButton && (
                <button
                  type="button"
                  onClick={onSayUneco}
                  className="animate-bounce rounded-full bg-yellow-500 px-5 py-1.5 text-sm font-extrabold text-black shadow-lg transition-transform hover:scale-110"
                >
                  UNECO!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My hand (bottom of table) */}
      <div className="border-t border-border pt-1">
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

      {/* Bottom bar: spectator count + forfeit */}
      <div className="flex items-center justify-center gap-4">
        {gameState.spectatorCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {gameState.spectatorCount} espectador{gameState.spectatorCount > 1 ? "es" : ""}
          </span>
        )}

        {myPlayer && (
          <button
            type="button"
            onClick={() => setShowForfeitModal(true)}
            className="rounded-lg bg-destructive/10 px-4 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            Desistir
          </button>
        )}
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
