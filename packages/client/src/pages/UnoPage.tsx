import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { useUno } from "@/hooks/useUno.js";
import { UnoLobby } from "@/components/uno/UnoLobby.js";
import { UnoRoom } from "@/components/uno/UnoRoom.js";
import type { UnoCardColor } from "@butecogames/shared";

export function UnoPage() {
  const { user } = useAuth();
  const {
    lobbyRooms,
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
    sayUno,
  } = useUno(user?.id);

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
    (color: UnoCardColor) => {
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
        <h1 className="text-2xl font-bold text-card-foreground">UNO</h1>
        <p className="mt-1 text-muted-foreground">
          Jogue UNO com até 10 jogadores! Seja o primeiro a ficar sem cartas.
        </p>
      </div>

      {isInLobby || !gameState ? (
        <UnoLobby
          rooms={lobbyRooms}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      ) : (
        <UnoRoom
          gameState={gameState}
          userId={user?.id ?? ""}
          colorPickerOpen={colorPickerOpen}
          onLeaveRoom={leaveRoom}
          onSetReady={setReady}
          onStartGame={startGame}
          onPlayCard={playCard}
          onDrawCard={drawCard}
          onSayUno={sayUno}
          onOpenColorPicker={handleOpenColorPicker}
          onCloseColorPicker={handleCloseColorPicker}
          onSelectColor={handleSelectColor}
        />
      )}
    </div>
  );
}
