interface DisconnectOverlayProps {
  disconnectedPlayer: string;
  countdown: number;
  isCurrentUser: boolean;
}

export function DisconnectOverlay({
  disconnectedPlayer,
  countdown,
  isCurrentUser,
}: DisconnectOverlayProps) {
  if (isCurrentUser) return null;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-yellow-600/50 bg-yellow-900/20 p-6">
      <div className="text-4xl">&#9888;</div>
      <h3 className="text-lg font-bold text-yellow-400">
        Oponente desconectou
      </h3>
      <p className="text-sm text-muted-foreground">
        Aguardando reconexão...
      </p>
      <div className="text-3xl font-bold text-white">{countdown}s</div>
      <p className="text-xs text-muted-foreground">
        Se o oponente não retornar, você vencerá por W.O.
      </p>
    </div>
  );
}
