import { useAuth } from "@/hooks/useAuth.js";
import { useWallet, useTransactions } from "@/hooks/useWallet.js";
import { formatCoins, translateTransactionType, translateGameId } from "@/lib/utils.js";

export function ProfilePage() {
  const { user } = useAuth();
  const { data: wallet } = useWallet();
  const { data: txData } = useTransactions();

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
      {wallet && (
        <div className="grid gap-4 sm:grid-cols-3">
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
        </div>
      )}

      {/* Transaction history */}
      <div>
        <h2 className="text-xl font-semibold text-card-foreground mb-4">
          Historico de transacoes
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Tipo</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Jogo</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">Valor</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">Saldo</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {txData?.transactions.map((tx) => (
                <tr key={tx._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 text-card-foreground">{translateTransactionType(tx.type)}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {translateGameId(tx.gameId) ?? "—"}
                  </td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      tx.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatCoins(tx.amount)}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {formatCoins(tx.balanceAfter)}
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground">
                    {new Date(tx.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!txData || txData.transactions.length === 0) && (
            <p className="p-4 text-center text-muted-foreground">
              Nenhuma transacao encontrada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
