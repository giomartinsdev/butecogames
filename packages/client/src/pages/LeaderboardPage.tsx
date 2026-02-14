import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboard } from "@/api/leaderboard.js";
import { formatCoins, cn } from "@/lib/utils.js";

type LeaderboardType = "coins" | "xp" | "wins";

const tabs: { key: LeaderboardType; label: string }[] = [
  { key: "coins", label: "Coins" },
  { key: "xp", label: "XP" },
  { key: "wins", label: "Ganhos" },
];

export function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("coins");
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", type],
    queryFn: () => fetchLeaderboard(type),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Ranking</h1>
        <p className="mt-1 text-muted-foreground">
          Os melhores jogadores da plataforma
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setType(tab.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              type === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-card-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-muted-foreground">Carregando ranking...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">#</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">
                  Jogador
                </th>
                <th className="px-4 py-2 text-center text-muted-foreground font-medium">
                  Level
                </th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">
                  {type === "coins" ? "Coins" : type === "xp" ? "XP" : "Total ganho"}
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.leaderboard.map((entry) => (
                <tr key={entry.userId} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-bold text-accent">{entry.rank}</td>
                  <td className="px-4 py-2 text-card-foreground">{entry.displayName}</td>
                  <td className="px-4 py-2 text-center text-muted-foreground">
                    {entry.level}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-card-foreground">
                    {formatCoins(entry.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data || data.leaderboard.length === 0) && (
            <p className="p-4 text-center text-muted-foreground">
              Nenhum jogador no ranking ainda
            </p>
          )}
        </div>
      )}
    </div>
  );
}
