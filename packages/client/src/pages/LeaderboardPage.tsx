import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { fetchLeaderboard } from "@/api/leaderboard.js";
import { formatCoins, cn } from "@/lib/utils.js";
import { DataTable } from "@/components/ui/DataTable.js";

type LeaderboardType = "coins" | "xp" | "wins";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  image: string | null;
  level: number;
  value: number;
}

const tabs: { key: LeaderboardType; label: string }[] = [
  { key: "coins", label: "Coins" },
  { key: "xp", label: "XP" },
  { key: "wins", label: "Ganhos" },
];

const valueHeader: Record<LeaderboardType, string> = {
  coins: "Coins",
  xp: "XP",
  wins: "Total ganho",
};

export function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("coins");
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", type],
    queryFn: () => fetchLeaderboard(type),
  });

  const columns = useMemo<ColumnDef<LeaderboardEntry, any>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "#",
        cell: ({ getValue }) => (
          <span className="font-bold text-accent">{getValue<number>()}</span>
        ),
      },
      {
        accessorKey: "displayName",
        header: "Jogador",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                {row.original.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-card-foreground">{row.original.displayName}</span>
          </div>
        ),
      },
      {
        accessorKey: "level",
        header: "Level",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<number>()}</span>
        ),
        meta: { textAlign: "center" } as any,
      },
      {
        accessorKey: "value",
        header: valueHeader[type],
        cell: ({ getValue }) => (
          <span className="font-medium text-card-foreground">
            {formatCoins(getValue<number>())}
          </span>
        ),
        meta: { textAlign: "right" } as any,
      },
    ],
    [type],
  );

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

      <DataTable
        columns={columns}
        data={data?.leaderboard ?? []}
        pageSize={10}
        isLoading={isLoading}
        emptyMessage="Nenhum jogador no ranking ainda"
      />
    </div>
  );
}
