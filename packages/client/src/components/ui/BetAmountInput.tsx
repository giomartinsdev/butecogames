import { useState, useEffect } from "react";
import { formatCoins } from "@/lib/utils.js";

interface BetAmountInputProps {
  minBet: number;
  maxBet: number;
  disabled: boolean;
  hasSelection: boolean;
  onPlaceBet: (amount: number) => void;
  placeholderText?: string;
  resetTrigger?: number;
  children?: React.ReactNode;
}

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

export function BetAmountInput({
  minBet,
  maxBet,
  disabled,
  hasSelection,
  onPlaceBet,
  placeholderText = "Selecione uma aposta",
  resetTrigger,
  children,
}: BetAmountInputProps) {
  const [amount, setAmount] = useState<number | "">(minBet);
  const [error, setError] = useState("");

  useEffect(() => {
    setAmount(minBet);
    setError("");
  }, [minBet, resetTrigger]);

  const handlePlaceBet = () => {
    if (!hasSelection) return;
    if (amount === "" || amount <= 0) {
      setError("Digite um valor para apostar");
      return;
    }
    if (amount < minBet) {
      setError(`Aposta mínima: ${formatCoins(minBet)} coins`);
      return;
    }
    if (amount > maxBet) {
      setError(`Aposta máxima: ${formatCoins(maxBet)} coins`);
      return;
    }
    setError("");
    onPlaceBet(amount);
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs text-muted-foreground">Valor da aposta</label>
        <input
          type="number"
          value={amount}
          disabled={disabled}
          onChange={(e) => {
            setError("");
            const val = e.target.value;
            setAmount(val === "" ? "" : Math.floor(Number(val)));
          }}
          className="mt-1 w-full rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            onClick={() => setAmount((prev) => (prev || 0) + v)}
            disabled={disabled}
            className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            +{formatCoins(v)}
          </button>
        ))}
        <button
          onClick={() => { setAmount(minBet); setError(""); }}
          disabled={disabled}
          className="ml-auto rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:text-card-foreground hover:bg-muted/80 transition-colors disabled:opacity-40"
        >
          Limpar
        </button>
      </div>

      <button
        onClick={handlePlaceBet}
        disabled={disabled || !hasSelection}
        className="w-full rounded-lg bg-accent py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {!hasSelection
          ? placeholderText
          : `Apostar ${formatCoins(amount || 0)} coins`}
      </button>

      {children}
    </div>
  );
}
