import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useUserProfile } from "@/hooks/useUserProfile.js";
import { useUneco } from "@/hooks/useUneco.js";
import { UnecoLobby } from "@/components/uneco/UnecoLobby.js";
import { UnecoRoom } from "@/components/uneco/UnecoRoom.js";
import type { UnecoCardColor } from "@butecogames/shared";

export function UnecoPage() {
  const { user } = useAuth();
  const { isAdmin } = useUserProfile();
  const {
    lobbyRooms,
    ongoingRooms,
    gameState,
    isInLobby,
    colorPickerOpen,
    setColorPickerOpen,
    pendingCardId,
    setPendingCardId,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    startGame,
    playCard,
    drawCard,
    sayUneco,
    forfeitGame,
    spectate,
    stopSpectating,
    adminCancelRoom,
  } = useUneco(user?.id);

  const isSpectator = gameState
    ? !gameState.players.some((p) => p.userId === user?.id)
    : false;

  const handleLeaveRoom = useCallback(() => {
    if (isSpectator) {
      stopSpectating();
    } else {
      leaveRoom();
    }
  }, [isSpectator, stopSpectating, leaveRoom]);

  const handleOpenColorPicker = useCallback(
    (cardId: string) => {
      setPendingCardId(cardId);
      setColorPickerOpen(true);
    },
    [setPendingCardId, setColorPickerOpen],
  );

  const handleCloseColorPicker = useCallback(() => {
    setPendingCardId(null);
    setColorPickerOpen(false);
  }, [setPendingCardId, setColorPickerOpen]);

  const handleSelectColor = useCallback(
    (color: UnecoCardColor) => {
      if (pendingCardId) {
        playCard(pendingCardId, color);
      }
      setPendingCardId(null);
      setColorPickerOpen(false);
    },
    [pendingCardId, playCard, setPendingCardId, setColorPickerOpen],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-card-foreground">UNECO</h1>
        <p className="mt-1 text-muted-foreground">
          Jogue UNECO com até 10 jogadores! Seja o primeiro a ficar sem cartas.
        </p>
      </div>

      {isInLobby || !gameState ? (
        <UnecoLobby
          rooms={lobbyRooms}
          ongoingRooms={ongoingRooms}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onSpectate={spectate}
          isAdmin={isAdmin}
          onAdminCancelRoom={adminCancelRoom}
        />
      ) : (
        <UnecoRoom
          gameState={gameState}
          userId={user?.id ?? ""}
          colorPickerOpen={colorPickerOpen}
          onLeaveRoom={handleLeaveRoom}
          onSetReady={setReady}
          onStartGame={startGame}
          onPlayCard={playCard}
          onDrawCard={drawCard}
          onSayUneco={sayUneco}
          onForfeit={forfeitGame}
          onOpenColorPicker={handleOpenColorPicker}
          onCloseColorPicker={handleCloseColorPicker}
          onSelectColor={handleSelectColor}
        />
      )}
    </div>
  );
}
