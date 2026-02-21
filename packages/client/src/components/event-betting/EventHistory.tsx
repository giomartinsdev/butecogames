import type { EventBettingEvent, EventOdds } from "@butecogames/shared";
import { EVENT_CATEGORIES, EVENT_CATEGORY_COLORS } from "@butecogames/shared";
import { formatCoins, getCategoryGradient, getCategoryBorderColor } from "@/lib/utils.js";

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
          className="rounded-lg border p-4 space-y-2"
          style={{
            background: getCategoryGradient(event.category),
            borderColor: getCategoryBorderColor(event.category),
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-xs font-medium mb-1"
                style={{ color: EVENT_CATEGORY_COLORS[event.category] }}
              >
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

          <div className="text-sm font-medium text-card-foreground flex items-center gap-2">
            {event.option1Image && (
              <img src={event.option1Image} alt={event.option1} className="w-6 h-6 rounded-full object-cover" />
            )}
            <span>{event.option1}</span>
            <span className="text-muted-foreground">vs</span>
            <span>{event.option2}</span>
            {event.option2Image && (
              <img src={event.option2Image} alt={event.option2} className="w-6 h-6 rounded-full object-cover" />
            )}
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
