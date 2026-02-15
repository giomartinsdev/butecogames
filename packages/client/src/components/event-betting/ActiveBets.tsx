import type { EventBettingBet } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";

interface ActiveBetsProps {
  bets: EventBettingBet[];
}

export function ActiveBets({ bets }: ActiveBetsProps) {
  if (bets.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        Você não tem apostas ativas
      </div>
    );
  }

  const getOptionLabel = (option: string, bet: EventBettingBet) => {
    // Get event info if populated
    const event = typeof bet.eventId === "object" ? bet.eventId : null;
    const eventName = event?.title || "Evento";

    let choice = "";
    if (option === "option1") {
      choice = event?.option1 || "Opção 1";
    } else if (option === "option2") {
      choice = event?.option2 || "Opção 2";
    } else {
      choice = "Empate";
    }

    return `${eventName} - ${choice}`;
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-card-foreground">Minhas Apostas Ativas</h3>
      <div className="space-y-2">
        {bets.map((bet) => (
          <div
            key={bet._id}
            className="rounded-lg border border-border bg-card p-3 space-y-1"
          >
            <div className="flex justify-between items-start">
              <div className="text-sm font-medium text-card-foreground">
                {getOptionLabel(bet.option, bet)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCoins(bet.amount)} coins
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Possível retorno: ~{formatCoins(Math.floor(bet.potentialPayout))} coins
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
