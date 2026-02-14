import { useState, useCallback } from "react";
import type { RouletteBetType } from "@butecogames/shared";
import { useRoulette } from "@/hooks/useRoulette.js";
import { RouletteWheel } from "./RouletteWheel.js";
import { BettingBoard } from "./BettingBoard.js";
import { BetControls } from "./BetControls.js";
import { RoundHistory } from "./RoundHistory.js";
import { ChatBox } from "@/components/chat/ChatBox.js";
import { cn, translateBetType } from "@/lib/utils.js";

export function RouletteGame() {
  const roulette = useRoulette();
  const [selectedBet, setSelectedBet] = useState<RouletteBetType | null>(null);

  const isBettingOpen = roulette.status === "betting";
  const isSpinning = roulette.status === "spinning";

  const handleBoardClick = useCallback((betType: RouletteBetType) => {
    setSelectedBet(betType);
  }, []);

  const handlePlaceBet = useCallback(
    (betType: RouletteBetType, amount: number) => {
      roulette.placeBet(betType, amount);
      setSelectedBet(null);
    },
    [roulette],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status bar */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div>
            <span className="text-sm text-muted-foreground">Rodada </span>
            <span className="font-bold text-card-foreground">#{roulette.roundNumber}</span>
          </div>
          <div
            className={cn(
              "rounded-full px-4 py-1 text-sm font-medium",
              isBettingOpen && "bg-green-500/20 text-green-400",
              isSpinning && "bg-yellow-500/20 text-yellow-400",
              roulette.status === "completed" && "bg-blue-500/20 text-blue-400",
            )}
          >
            {isBettingOpen && `Apostas abertas (${roulette.timeRemaining}s)`}
            {isSpinning && "Girando..."}
            {roulette.status === "completed" && "Resultado"}
          </div>
          <div className="text-sm text-muted-foreground">
            Apostas: {roulette.currentBets.length}
          </div>
        </div>

        {/* Wheel */}
        <div className="flex justify-center py-6">
          <RouletteWheel
            result={roulette.lastResult?.result ?? null}
            spinning={isSpinning}
          />
        </div>

        {/* Betting board */}
        <BettingBoard onBet={handleBoardClick} disabled={!isBettingOpen} />

        {/* Error display */}
        {roulette.error && (
          <div className="rounded-lg bg-destructive/20 px-4 py-2 text-sm text-destructive">
            {roulette.error}
          </div>
        )}

        {/* Round history */}
        <RoundHistory results={roulette.recentResults} />

        {/* Winners display */}
        {roulette.lastResult && roulette.lastResult.winners.length > 0 && (
          <div className="rounded-xl border border-accent/50 bg-accent/10 p-4">
            <h3 className="text-sm font-medium text-accent mb-2">Vencedores</h3>
            <div className="space-y-1">
              {roulette.lastResult.winners.map((w, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-card-foreground">{w.displayName}</span>
                  <span className="font-medium text-accent">+{w.payout} coins</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <BetControls
          onPlaceBet={handlePlaceBet}
          selectedBet={selectedBet}
          disabled={!isBettingOpen}
        />

        {/* Current bets */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Apostas desta rodada
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {roulette.currentBets.map((bet, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-card-foreground">{bet.displayName}</span>
                <span className="text-muted-foreground">
                  {bet.amount} em {translateBetType(bet.betType)}
                </span>
              </div>
            ))}
            {roulette.currentBets.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma aposta ainda</p>
            )}
          </div>
        </div>

        <ChatBox />
      </div>
    </div>
  );
}
