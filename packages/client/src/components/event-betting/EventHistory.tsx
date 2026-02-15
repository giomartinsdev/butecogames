import type { EventBettingEvent, EventOdds } from "@butecogames/shared";
import { EVENT_CATEGORIES } from "@butecogames/shared";
import { formatCoins } from "@/lib/utils.js";

interface EventHistoryProps {
  events: Array<EventBettingEvent & { odds: EventOdds }>;
}

export function EventHistory({ events }: EventHistoryProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
        Nenhum evento concluído
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event._id}
          className="rounded-lg border border-border bg-card p-4 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {EVENT_CATEGORIES[event.category]}
              </div>
              <h4 className="font-bold text-card-foreground">{event.title}</h4>
              {event.startTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(event.startTime)}
                </p>
              )}
            </div>
            <div className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
              {event.status === "completed" ? "Concluído" : "Cancelado"}
            </div>
          </div>

          <div className="text-sm font-medium text-card-foreground">
            {event.option1} vs {event.option2}
          </div>

          {event.result && (
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

          <div className="text-xs text-muted-foreground">
            Pool total: {formatCoins(event.totalPool)} coins
          </div>
        </div>
      ))}
    </div>
  );
}
