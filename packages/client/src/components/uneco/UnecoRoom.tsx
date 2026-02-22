import type { UnecoGameState, UnecoCardColor } from "@butecogames/shared";
import { UnecoGameBoard } from "./UnecoGameBoard.js";
import { UnecoResults } from "./UnecoResults.js";
import { formatCoins } from "@/lib/utils.js";

interface UnecoRoomProps {
  gameState: UnecoGameState;
  userId: string;
  colorPickerOpen: boolean;
  onLeaveRoom: () => void;
  onSetReady: () => void;
  onStartGame: () => void;
  onPlayCard: (cardId: string, chosenColor?: UnecoCardColor) => void;
  onDrawCard: () => void;
  onSayUneco: () => void;
  onForfeit: () => void;
  onOpenColorPicker: (cardId: string) => void;
  onCloseColorPicker: () => void;
  onSelectColor: (color: UnecoCardColor) => void;
}

function WaitingRoom({
  gameState,
  userId,
  onLeaveRoom,
  onSetReady,
  onStartGame,
}: {
  gameState: UnecoGameState;
  userId: string;
  onLeaveRoom: () => void;
  onSetReady: () => void;
  onStartGame: () => void;
}) {
  const isOwner = gameState.players[0]?.userId === userId;
  const allReady = gameState.players.every((p) => p.isReady);
  const myPlayer = gameState.players.find((p) => p.userId === userId);
  const minPlayers = 2;
  const canStart =
    isOwner && allReady && gameState.players.length >= minPlayers;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-card-foreground">
            Sala de UNECO
          </h3>
          <span className="text-sm text-muted-foreground">
            {formatCoins(gameState.betAmount)} coins
          </span>
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            Jogadores ({gameState.players.length}/{gameState.maxPlayers})
          </p>
          {gameState.players.map((player, i) => (
            <div
              key={player.userId}
              className="flex items-center justify-between rounded border border-border bg-background px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {player.avatar ? (
                  <img
                    src={player.avatar}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-card-foreground">
                  {player.displayName}
                  {i === 0 && " (dono)"}
                  {player.userId === userId && " (você)"}
                </span>
              </div>
              <span
                className={`text-xs font-medium ${player.isReady ? "text-green-400" : "text-muted-foreground"
                  }`}
              >
                {player.isReady ? "Pronto" : "Aguardando"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {!isOwner && myPlayer && (
            <button
              type="button"
              onClick={onSetReady}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${myPlayer.isReady
                  ? "bg-muted text-muted-foreground hover:bg-muted/80"
                  : "bg-green-600 text-white hover:bg-green-600/90"
                }`}
            >
              {myPlayer.isReady ? "Cancelar" : "Pronto"}
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              Iniciar Jogo
            </button>
          )}

          <button
            type="button"
            onClick={onLeaveRoom}
            className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnecoRoom({
  gameState,
  userId,
  colorPickerOpen,
  onLeaveRoom,
  onSetReady,
  onStartGame,
  onPlayCard,
  onDrawCard,
  onSayUneco,
  onForfeit,
  onOpenColorPicker,
  onCloseColorPicker,
  onSelectColor,
}: UnecoRoomProps) {
  if (gameState.status === "waiting" || gameState.status === "starting") {
    return (
      <WaitingRoom
        gameState={gameState}
        userId={userId}
        onLeaveRoom={onLeaveRoom}
        onSetReady={onSetReady}
        onStartGame={onStartGame}
      />
    );
  }

  if (gameState.status === "finished") {
    return (
      <UnecoResults
        gameState={gameState}
        userId={userId}
        onReturnToLobby={onLeaveRoom}
      />
    );
  }

  return (
    <UnecoGameBoard
      gameState={gameState}
      userId={userId}
      colorPickerOpen={colorPickerOpen}
      onPlayCard={onPlayCard}
      onDrawCard={onDrawCard}
      onSayUneco={onSayUneco}
      onForfeit={onForfeit}
      onOpenColorPicker={onOpenColorPicker}
      onCloseColorPicker={onCloseColorPicker}
      onSelectColor={onSelectColor}
    />
  );
}
