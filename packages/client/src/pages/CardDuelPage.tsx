import { useAuth } from "@/hooks/useAuth.js";
import { useWallet } from "@/hooks/useWallet.js";
import { useSettings } from "@/hooks/useSettings.js";
import { useCardDuel } from "@/hooks/useCardDuel.js";
import { CardDuelLobby } from "@/components/card-duel/CardDuelLobby.js";
import { CardDuelRoom } from "@/components/card-duel/CardDuelRoom.js";

export function CardDuelPage() {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const { data: settings } = useSettings();
  const {
    lobbyRooms,
    roomState,
    isInLobby,
    isSearching,
    cardRevealCountdown,
    createRoom,
    joinRoom,
    quickMatch,
    cancelSearch,
    playBot,
    leaveRoom,
    cancelRoom,
    setReady,
    startMatch,
    acceptRevenge,
    declineRevenge,
  } = useCardDuel(user?.id);

  const balance = wallet?.balance ?? 0;
  const minBet = settings?.cardDuel?.minBet ?? 10;
  const maxBet = settings?.cardDuel?.maxBet ?? 10000;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-card-foreground">
          Duelo de Cartas
        </h1>
        <p className="mt-1 text-muted-foreground">
          Desafie outro jogador! A carta mais alta vence o pote.
        </p>
      </div>

      {isInLobby || !roomState ? (
        <CardDuelLobby
          rooms={lobbyRooms}
          balance={balance}
          minBet={minBet}
          maxBet={maxBet}
          isSearching={isSearching}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onQuickMatch={quickMatch}
          onCancelSearch={cancelSearch}
          onPlayBot={playBot}
        />
      ) : (
        <CardDuelRoom
          roomState={roomState}
          userId={user?.id ?? ""}
          cardRevealCountdown={cardRevealCountdown}
          onLeave={leaveRoom}
          onCancel={cancelRoom}
          onReady={setReady}
          onStart={startMatch}
          onAcceptRevenge={acceptRevenge}
          onDeclineRevenge={declineRevenge}
        />
      )}
    </div>
  );
}
