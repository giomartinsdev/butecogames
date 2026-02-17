import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEventBetting } from "@/hooks/useEventBetting.js";
import { useSettings } from "@/hooks/useSettings.js";
import { EventCard } from "@/components/event-betting/EventCard.js";
import { ActiveBets } from "@/components/event-betting/ActiveBets.js";
import { EventHistory } from "@/components/event-betting/EventHistory.js";
import { apiClient } from "@/api/client.js";
import {
  DEFAULT_EVENT_BETTING_MIN_BET,
  DEFAULT_EVENT_BETTING_MAX_BET,
} from "@butecogames/shared";

type FilterTab = "upcoming" | "in_progress" | "completed";

export function EventBettingPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");
  const { events, placeBet } = useEventBetting();
  const { data: settings } = useSettings();
  const minBet = settings?.eventBetting?.minBet ?? DEFAULT_EVENT_BETTING_MIN_BET;
  const maxBet = settings?.eventBetting?.maxBet ?? DEFAULT_EVENT_BETTING_MAX_BET;

  // Fetch user's bets
  const { data: myBetsData } = useQuery({
    queryKey: ["event-betting-my-bets"],
    queryFn: async () => {
      const res = await apiClient.get("/api/event-betting/my-bets");
      return res.json();
    },
  });

  const filteredEvents = events.filter((e) => e.status === activeTab);
  const activeBets = myBetsData?.bets?.filter(
    (bet: any) => bet.won === null
  ) || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-card-foreground mb-2">
          Eventos
        </h1>
        <p className="text-muted-foreground"></p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter tabs */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "upcoming"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setActiveTab("in_progress")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "in_progress"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              Em Andamento
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "completed"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-card-foreground"
              }`}
            >
              Concluídos
            </button>
          </div>

          {/* Events */}
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  {activeTab === "upcoming" &&
                    "Nenhum evento próximo disponível"}
                  {activeTab === "in_progress" &&
                    "Nenhum evento em andamento"}
                  {activeTab === "completed" && "Nenhum evento concluído"}
                </p>
              </div>
            ) : activeTab === "completed" ? (
              <EventHistory events={filteredEvents} />
            ) : (
              filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onPlaceBet={placeBet}
                  minBet={minBet}
                  maxBet={maxBet}
                />
              ))
            )}
          </div>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-4">
          <ActiveBets bets={activeBets} />

          {/* Info card */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <h3 className="font-bold text-card-foreground">Como Funciona</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• As odds são dinâmicas e mudam conforme as apostas</li>
              <li>• Quanto mais pessoas apostam em uma opção, menor a odd</li>
              <li>• O pool total é dividido entre os vencedores</li>
              <li>• Taxa da casa: 5%</li>
              <li>• Máximo de 3 apostas por evento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
