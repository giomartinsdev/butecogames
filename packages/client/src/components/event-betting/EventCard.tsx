import { useState } from "react";
import type { EventBettingEvent, EventOdds, BetOption } from "@butecogames/shared";
import { EVENT_CATEGORIES } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";
import { cn } from "@/lib/utils.js";
import { BetAmountInput } from "@/components/ui/BetAmountInput.js";

interface EventCardProps {
  event: EventBettingEvent & { odds: EventOdds };
  onPlaceBet: (eventId: string, option: BetOption, amount: number) => void;
  disabled?: boolean;
  minBet: number;
  maxBet: number;
}

export function EventCard({ event, onPlaceBet, disabled = false, minBet, maxBet }: EventCardProps) {
  const [selectedOption, setSelectedOption] = useState<BetOption | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  const isUpcoming = event.status === "upcoming";
  const canBet = isUpcoming && !disabled && (!event.startTime || new Date(event.startTime) > new Date());

  const handlePlaceBet = (amount: number) => {
    if (!selectedOption || !canBet) return;
    onPlaceBet(event._id, selectedOption, amount);
    setSelectedOption(null);
    setResetTrigger((t) => t + 1);
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
            {EVENT_CATEGORIES[event.category]}
          </div>
          <h3 className="font-bold text-card-foreground">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
          )}
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
      {event.startTime && (
        <div className="text-sm text-muted-foreground">
          Início: {formatDate(event.startTime)}
        </div>
      )}

      {/* Betting options */}
      <div className={cn("grid gap-2", event.allowDraw ? "grid-cols-3" : "grid-cols-2")}>
        <button
          onClick={() => setSelectedOption("option1")}
          disabled={!canBet}
          className={cn(
            "rounded-lg border p-3 transition-all disabled:opacity-40",
            selectedOption === "option1"
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-primary/50"
          )}
        >
          <div className="text-sm font-medium text-card-foreground mb-1">
            {event.option1}
          </div>
          <div className="text-xs text-accent font-bold">
            {event.odds.option1.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Pool: {formatCoins(event.option1Pool)}
          </div>
        </button>

        {event.allowDraw && (
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
              {event.odds.draw?.toFixed(2)}x
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Pool: {formatCoins(event.drawPool)}
            </div>
          </button>
        )}

        <button
          onClick={() => setSelectedOption("option2")}
          disabled={!canBet}
          className={cn(
            "rounded-lg border p-3 transition-all disabled:opacity-40",
            selectedOption === "option2"
              ? "border-primary bg-primary/10"
              : "border-border bg-muted hover:border-primary/50"
          )}
        >
          <div className="text-sm font-medium text-card-foreground mb-1">
            {event.option2}
          </div>
          <div className="text-xs text-accent font-bold">
            {event.odds.option2.toFixed(2)}x
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Pool: {formatCoins(event.option2Pool)}
          </div>
        </button>
      </div>

      {/* Result (if completed) */}
      {event.status === "completed" && event.result && (
        <div className="rounded bg-accent/10 border border-accent/20 p-2 text-center">
          <span className="text-sm font-medium text-accent">
            Resultado:{" "}
            {event.result === "option1"
              ? event.option1
              : event.result === "option2"
              ? event.option2
              : "Empate"}
          </span>
        </div>
      )}

      {/* Betting controls */}
      {isUpcoming && (
        <div className="pt-2 border-t border-border">
          {!canBet && (
            <div className="rounded bg-muted p-2 text-center text-xs text-muted-foreground mb-2">
              {event.startTime && new Date(event.startTime) <= new Date()
                ? "Este evento já começou"
                : "Apostas indisponíveis"}
            </div>
          )}

          <BetAmountInput
            minBet={minBet}
            maxBet={maxBet}
            disabled={!canBet}
            hasSelection={!!selectedOption}
            onPlaceBet={handlePlaceBet}
            placeholderText="Selecione uma opção"
            resetTrigger={resetTrigger}
          />
        </div>
      )}

      {/* Total pool */}
      <div className="text-xs text-center text-muted-foreground pt-2 border-t border-border">
        Pool total: {formatCoins(event.totalPool)} coins
      </div>
    </div>
  );
}
