import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWallet, fetchTransactions, claimDailyReward } from "@/api/wallet.js";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
    select: (data) => data.wallet,
  });
}

export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ["transactions", page],
    queryFn: () => fetchTransactions(page),
  });
}

export function useClaimDailyReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: claimDailyReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
