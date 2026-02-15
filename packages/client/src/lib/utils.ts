import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RouletteBetType, TransactionType } from "@butecogames/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoins(amount: number): string {
  return amount.toLocaleString("pt-BR");
}

export function translateBetType(betType: RouletteBetType): string {
  // Handle simple bet types
  const simpleTypes: Record<string, string> = {
    red: "Vermelho",
    black: "Preto",
    odd: "Ímpar",
    even: "Par",
    low: "Baixo (1-18)",
    high: "Alto (19-36)",
  };

  if (simpleTypes[betType]) {
    return simpleTypes[betType];
  }

  // Handle complex bet types with patterns
  if (betType.startsWith("number:")) {
    const number = betType.split(":")[1];
    return `Número ${number}`;
  }

  if (betType.startsWith("dozen:")) {
    const dozen = betType.split(":")[1];
    const ranges = { "1": "1-12", "2": "13-24", "3": "25-36" };
    return `Dúzia ${dozen} (${ranges[dozen as keyof typeof ranges]})`;
  }

  return betType;
}

const transactionTypeLabels: Record<TransactionType, string> = {
  initial_balance: "Saldo inicial",
  daily_reward: "Recompensa diária",
  bet_placed: "Aposta",
  bet_won: "Ganho",
  achievement_reward: "Conquista",
  transfer_sent: "Transferência enviada",
  transfer_received: "Transferência recebida",
};

export function translateTransactionType(type: TransactionType): string {
  return transactionTypeLabels[type] ?? type;
}

const gameLabels: Record<string, string> = {
  roulette: "Roleta",
  "event-betting": "Eventos",
};

export function translateGameId(gameId: string | undefined): string | null {
  if (!gameId) return null;
  return gameLabels[gameId] ?? gameId;
}
