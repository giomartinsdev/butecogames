import { useState } from "react";
import type { SportsBettingEvent, EventOdds, BetOption } from "@butecogames/shared";
import { SPORT_CATEGORIES, SPORTS_BETTING_MIN_BET, SPORTS_BETTING_MAX_BET } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";

interface EventCardProps {
  event: SportsBettingEvent & { odds: EventOdds };
  onPlaceBet: (eventId: string, option: BetOption, amount: number) => void;
  disabled?: boolean;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export function EventCard({ event, onPlaceBet, disabled = false }: EventCardProps) {
  const [selectedOption, setSelectedOption] = useState<BetOption | null>(null);
  const [amount, setAmount] = useState(SPORTS_BETTING_MIN_BET);

  const isUpcoming = event.status === "upcoming";
  const canBet = isUpcoming && !disabled && new Date(event.startTime) > new Date();

  const handlePlaceBet = () => {
    if (!selectedOption || !canBet) return;
    onPlaceBet(event._id, selectedOption, amount);
    setSelectedOption(null);
    setAmount(SPORTS_BETTING_MIN_BET);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">
            {SPORT_CATEGORIES[event.category]}
          </div>
          <h3 className="font-bold text-card-foreground">{event.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
        </div>
        <div
          className={cn(
            "rounded px-2 py-1 text-xs font-medium",
            event.status === "upcoming" && "bg-primary/20 text-primary",
            event.status === "in_progress" && "bg-accent/20 text-accent",
            event.status === "completed" && "bg-muted text-muted-foreground",
            event.status === "cancelled" && "bg-destructive/20 text-destructive"
          )}
        >
          {event.status === "upcoming" && "Próximo"}
          {event.status === "in_progress" && "Em Andamento"}
          {event.status === "completed" && "Concluído"}
          {event.status === "cancelled" && "Cancelado"}
        </div>
      </div>

      {/* Start time */}
      <div className="text-sm text-muted-foreground">
        Início: {formatDate(event.startTime)}
      </div>

      {/* Betting options */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setSelectedOption("team1")}
          disabled={!canBet}
          className={cn(
            "rounded-lg border p-3 transition-all disabled:opacity-40",
            selectedOption === "team1"
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-primary/50"
          )}
        >
          <div className="text-sm font-medium text-card-foreground mb-1">
            {event.team1}
          </div>
          <div className="text-xs text-accent font-bold">
            {event.odds.team1.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Pool: {formatCoins(event.team1Pool)}
          </div>
        </button>

        <button
          onClick={() => setSelectedOption("draw")}
          disabled={!canBet}
          className={cn(
            "rounded-lg border p-3 transition-all disabled:opacity-40",
            selectedOption === "draw"
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-primary/50"
          )}
        >
          <div className="text-sm font-medium text-card-foreground mb-1">Empate</div>
          <div className="text-xs text-accent font-bold">
            {event.odds.draw.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Pool: {formatCoins(event.drawPool)}
          </div>
        </button>

        <button
          onClick={() => setSelectedOption("team2")}
          disabled={!canBet}
          className={cn(
            "rounded-lg border p-3 transition-all disabled:opacity-40",
            selectedOption === "team2"
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-primary/50"
          )}
        >
          <div className="text-sm font-medium text-card-foreground mb-1">
            {event.team2}
          </div>
          <div className="text-xs text-accent font-bold">
            {event.odds.team2.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Pool: {formatCoins(event.team2Pool)}
          </div>
        </button>
      </div>

      {/* Result (if completed) */}
      {event.status === "completed" && event.result && (
        <div className="rounded bg-accent/10 border border-accent/20 p-2 text-center">
          <span className="text-sm font-medium text-accent">
            Resultado:{" "}
            {event.result === "team1"
              ? event.team1
              : event.result === "team2"
              ? event.team2
              : "Empate"}
          </span>
        </div>
      )}

      {/* Betting controls */}
      {isUpcoming && (
        <div className="space-y-2 pt-2 border-t border-border">
          {!canBet && (
            <div className="rounded bg-muted p-2 text-center text-xs text-muted-foreground">
              {new Date(event.startTime) <= new Date()
                ? "Este evento já começou"
                : "Apostas indisponíveis"}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Valor da aposta</label>
            <input
              type="number"
              min={SPORTS_BETTING_MIN_BET}
              max={SPORTS_BETTING_MAX_BET}
              value={amount}
              disabled={!canBet}
              onChange={(e) =>
                setAmount(
                  Math.max(
                    SPORTS_BETTING_MIN_BET,
                    Math.min(SPORTS_BETTING_MAX_BET, Number(e.target.value))
                  )
                )
              }
              className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                disabled={!canBet}
                className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-40"
              >
                {formatCoins(v)}
              </button>
            ))}
          </div>

          <button
            onClick={handlePlaceBet}
            disabled={!selectedOption || !canBet}
            className="w-full rounded-lg bg-accent py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {!selectedOption
              ? "Selecione uma opção"
              : `Apostar ${formatCoins(amount)} coins`}
          </button>

          {selectedOption && canBet && (
            <p className="text-center text-xs text-muted-foreground">
              Possível retorno: ~{formatCoins(Math.floor(amount * event.odds[selectedOption]))} coins
            </p>
          )}
        </div>
      )}

      {/* Total pool */}
      <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
        Pool total: {formatCoins(event.totalPool)} coins
      </div>
    </div>
  );
}
