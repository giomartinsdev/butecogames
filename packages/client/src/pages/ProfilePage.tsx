import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@butecogames/shared";
import { useAuth } from "@/hooks/useAuth.js";
import { useWallet, useTransactions } from "@/hooks/useWallet.js";
import { useLevelInfo } from "@/hooks/useGamification.js";
import { formatCoins, translateTransactionType, translateGameId } from "@/lib/utils.js";
import { DataTable } from "@/components/ui/DataTable.js";
import { ChallengesPanel } from "@/components/gamification/ChallengesPanel.js";
import { AchievementsGallery } from "@/components/gamification/AchievementsGallery.js";

export function ProfilePage() {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const { data: levelInfo } = useLevelInfo();
  const [page, setPage] = useState(1);
  const { data: txData, isLoading: txLoading } = useTransactions(page);

  const columns = useMemo<ColumnDef<Transaction, any>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ getValue }) => (
          <span className="text-card-foreground">
            {translateTransactionType(getValue())}
          </span>
        ),
      },
      {
        id: "detail",
        header: "Detalhe",
        cell: ({ row }) => {
          const tx = row.original;
          if (tx.relatedUserName) {
            return (
              <span className="text-muted-foreground">
                {tx.relatedUserName}
              </span>
            );
          }
          return (
            <span className="text-muted-foreground">
              {translateGameId(tx.gameId) ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Valor",
        cell: ({ getValue }) => {
          const amount = getValue<number>();
          return (
            <span
              className={`font-medium ${amount > 0 ? "text-green-400" : "text-red-400"}`}
            >
              {amount > 0 ? "+" : ""}
              {formatCoins(amount)}
            </span>
          );
        },
        meta: { textAlign: "right" } as any,
      },
      {
        accessorKey: "balanceAfter",
        header: "Saldo",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {formatCoins(getValue<number>())}
          </span>
        ),
        meta: { textAlign: "right" } as any,
      },
      {
        accessorKey: "createdAt",
        header: "Data",
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {new Date(getValue<string>()).toLocaleString("pt-BR")}
          </span>
        ),
        meta: { textAlign: "right" } as any,
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        {user?.image && (
          <img src={user.image} alt={user.name} className="h-16 w-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {wallet && (
          <>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="text-2xl font-bold text-accent">{formatCoins(wallet.balance)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total apostado</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatCoins(wallet.totalWagered)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total ganho</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCoins(wallet.totalWon)}
              </p>
            </div>
          </>
        )}
        {levelInfo && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Nível</p>
            <p className="text-2xl font-bold text-accent">Lv. {levelInfo.level}</p>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {levelInfo.currentXp} / {levelInfo.xpForNextLevel} XP
            </p>
          </div>
        )}
      </div>

      {/* Challenges */}
      <ChallengesPanel />

      {/* Achievements */}
      <AchievementsGallery />

      {/* Transaction history */}
      <div>
        <h2 className="text-xl font-semibold text-card-foreground mb-4">
          Historico de transacoes
        </h2>
        <DataTable
          columns={columns}
          data={txData?.transactions ?? []}
          pagination={txData?.pagination}
          onPageChange={setPage}
          isLoading={txLoading}
          emptyMessage="Nenhuma transacao encontrada"
        />
      </div>
    </div>
  );
}
