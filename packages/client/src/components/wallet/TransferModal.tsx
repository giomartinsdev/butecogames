import { useState, useEffect, useRef } from "react";
import { useTransferCoins } from "@/hooks/useWallet.js";
import { searchUsers, type SearchUser } from "@/api/wallet.js";
import { formatCoins } from "@/lib/utils.js";
import { toast } from "sonner";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
}

export function TransferModal({ open, onClose }: TransferModalProps) {
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [amount, setAmount] = useState<number | "">("");
  const transfer = useTransferCoins();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!open) {
      setSelectedUser(null);
      setQuery("");
      setResults([]);
      setShowDropdown(false);
      setAmount("");
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query.trim());
        setResults(res.users);
        setShowDropdown(true);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!open) return null;

  const handleSelect = (user: SearchUser) => {
    setSelectedUser(user);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  const handleEdit = () => {
    setSelectedUser(null);
    setQuery("");
    setResults([]);
  };

  const handleSubmit = () => {
    if (!selectedUser) {
      toast.error("Selecione um destinatário");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    transfer.mutate(
      { recipientId: selectedUser.id, amount },
      {
        onSuccess: () => {
          toast.success(`${formatCoins(amount)} coins transferidos para ${selectedUser.name}`);
          setSelectedUser(null);
          setAmount("");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-card-foreground">Transferir Coins</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Destinatário</label>

            {selectedUser ? (
              <div className="mt-1 flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
                <img
                  src={selectedUser.image || "/default-avatar.png"}
                  alt={selectedUser.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {selectedUser.name}
                  </p>
                  {selectedUser.discordId && (
                    <p className="truncate text-xs text-muted-foreground">
                      #{selectedUser.discordId}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleEdit}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-card hover:text-card-foreground transition-colors"
                  title="Alterar destinatário"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setShowDropdown(true)}
                  placeholder="Buscar usuário..."
                  className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                {showDropdown && results.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                    {results.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelect(user)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                      >
                        <img
                          src={user.image || "/default-avatar.png"}
                          alt={user.name}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {user.name}
                          </p>
                          {user.discordId && (
                            <p className="truncate text-xs text-muted-foreground">
                              #{user.discordId}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && results.length === 0 && query.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-3 text-center text-sm text-muted-foreground shadow-lg">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Valor</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === "" ? "" : Math.floor(Number(val)));
              }}
              placeholder="Quantidade de coins"
              min={1}
              className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-muted py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={transfer.isPending || !selectedUser}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {transfer.isPending ? "Enviando..." : "Transferir"}
          </button>
        </div>
      </div>
    </div>
  );
}
