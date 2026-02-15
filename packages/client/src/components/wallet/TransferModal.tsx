import { useState } from "react";
import { useTransferCoins } from "@/hooks/useWallet.js";
import { formatCoins } from "@/lib/utils.js";
import { toast } from "sonner";

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
}

export function TransferModal({ open, onClose }: TransferModalProps) {
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const transfer = useTransferCoins();

  if (!open) return null;

  const handleSubmit = () => {
    if (!recipientName.trim()) {
      toast.error("Digite o nome do destinatário");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    transfer.mutate(
      { recipientName: recipientName.trim(), amount },
      {
        onSuccess: () => {
          toast.success(`${formatCoins(amount)} coins transferidos para ${recipientName.trim()}`);
          setRecipientName("");
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
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nome do usuário"
              className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary"
            />
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
            disabled={transfer.isPending}
            className="flex-1 rounded-lg bg-accent py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {transfer.isPending ? "Enviando..." : "Transferir"}
          </button>
        </div>
      </div>
    </div>
  );
}
