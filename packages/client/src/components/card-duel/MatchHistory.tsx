import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchHistory } from "@/api/card-duel.js";
import { formatCoins } from "@/lib/utils.js";
import { RANK_NAMES, SUIT_SYMBOLS } from "@butecogames/shared";
import type { CardDuelMatchHistory as MatchRecord, Card } from "@butecogames/shared";

interface MatchHistoryProps {
  userId: string;
}

function formatCard(card: Card): string {
  return `${RANK_NAMES[card.rank] ?? card.rank}${SUIT_SYMBOLS[card.suit] ?? ""}`;
}

function resultLabel(
  match: MatchRecord,
  userId: string,
): { text: string; color: string } {
  if (match.result === "draw") return { text: "Empate", color: "text-yellow-400" };
  if (match.winnerId === userId) return { text: "Vitoria", color: "text-green-400" };
  return { text: "Derrota", color: "text-red-400" };
}

function gameTypeLabel(type: string): string {
  return type === "best_of_3" ? "Melhor de 3" : "Classico";
}

export function MatchHistory({ userId }: MatchHistoryProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["card-duel-history", page],
    queryFn: () => fetchMatchHistory(page),
  });

  if (isLoading) {
    return <p className="py-4 text-center text-muted-foreground">Carregando...</p>;
  }

  if (!data || data.matches.length === 0) {
    return (
      <p className="py-4 text-center text-muted-foreground">
        Nenhuma partida encontrada
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-muted-foreground">
              <th className="px-3 py-2">Oponente</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Aposta</th>
              <th className="px-3 py-2">Resultado</th>
              <th className="px-3 py-2">Rodadas</th>
              <th className="px-3 py-2">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.matches.map((match) => {
              const isP1 = match.player1.userId === userId;
              const opponent = isP1 ? match.player2 : match.player1;
              const result = resultLabel(match, userId);

              return (
                <tr key={match._id} className="text-zinc-300">
                  <td className="px-3 py-2 font-medium">
                    {opponent.displayName}
                    {match.isBot && (
                      <span className="ml-1 text-xs text-zinc-500">(Bot)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {gameTypeLabel(match.gameType)}
                  </td>
                  <td className="px-3 py-2 text-yellow-400">
                    {formatCoins(match.betAmount)}
                  </td>
                  <td className={`px-3 py-2 font-medium ${result.color}`}>
                    {result.text}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {match.rounds.map((r) => (
                      <span key={r.roundNumber} className="mr-2">
                        {formatCard(r.player1Card)} vs {formatCard(r.player2Card)}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(match.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-600 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
            disabled={page >= data.pagination.pages}
            className="rounded bg-zinc-700 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-600 disabled:opacity-40"
          >
            Proxima
          </button>
        </div>
      )}
    </div>
  );
}
