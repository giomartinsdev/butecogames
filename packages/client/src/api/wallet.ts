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

interface TransferResponse {
  wallet: Wallet;
}

export function transferCoins(recipientId: string, amount: number) {
  return apiFetch<TransferResponse>("/api/wallet/transfer", {
    method: "POST",
    body: JSON.stringify({ recipientId, amount }),
  });
}

export interface SearchUser {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
}

interface SearchUsersResponse {
  users: SearchUser[];
}

export function searchUsers(query: string) {
  return apiFetch<SearchUsersResponse>(`/api/wallet/search-users?q=${encodeURIComponent(query)}`);
}
