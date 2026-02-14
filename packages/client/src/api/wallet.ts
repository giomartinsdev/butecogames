import { apiFetch } from "./client.js";
import type { Wallet, Transaction } from "@butecogames/shared";

interface WalletResponse {
  wallet: Wallet;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface DailyRewardResponse {
  wallet: Wallet;
  claimed: boolean;
}

export function fetchWallet() {
  return apiFetch<WalletResponse>("/api/wallet");
}

export function fetchTransactions(page = 1) {
  return apiFetch<TransactionsResponse>(`/api/wallet/transactions?page=${page}`);
}

export function claimDailyReward() {
  return apiFetch<DailyRewardResponse>("/api/wallet/daily-reward", {
    method: "POST",
  });
}
