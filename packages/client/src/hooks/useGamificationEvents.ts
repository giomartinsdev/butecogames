import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "@/stores/socketStore.js";
import { useSoundStore } from "@/stores/soundStore.js";
import { toast } from "sonner";

export function useGamificationEvents() {
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleLevelUp = (data: { level: number; xp: number }) => {
      queryClient.invalidateQueries({ queryKey: ["level-info"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-stats"] });
      toast.success(`Nível ${data.level}!`, {
        description: "Você subiu de nível!",
      });
      useSoundStore.getState().playSound("bet_win");
    };

    const handleAchievement = (data: { achievementId: string; name: string; reward: number }) => {
      queryClient.invalidateQueries({ queryKey: ["my-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(`Conquista desbloqueada!`, {
        description: `${data.name} — +${data.reward} coins`,
      });
      useSoundStore.getState().playSound("bet_win");
    };

    const handleXpGained = (data: { xpGained: number; totalXp: number; level: number; leveledUp: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["level-info"] });
      // XP float animation is handled by XpBar component via custom event
      window.dispatchEvent(new CustomEvent("xp:gained", { detail: { xpGained: data.xpGained } }));
    };

    const handleChallengeCompleted = (data: { challengeId: string; name: string; rewardCoins: number; rewardXp: number }) => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["gamification-stats"] });
      toast.success(`Desafio completo!`, {
        description: `${data.name} — +${data.rewardCoins} coins, +${data.rewardXp} XP`,
      });
      useSoundStore.getState().playSound("bet_win");
    };

    const handleChallengeProgress = () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    };

    socket.on("user:level_up", handleLevelUp);
    socket.on("user:achievement", handleAchievement);
    socket.on("user:xp_gained", handleXpGained);
    socket.on("user:challenge_completed", handleChallengeCompleted);
    socket.on("user:challenge_progress", handleChallengeProgress);

    return () => {
      socket.off("user:level_up", handleLevelUp);
      socket.off("user:achievement", handleAchievement);
      socket.off("user:xp_gained", handleXpGained);
      socket.off("user:challenge_completed", handleChallengeCompleted);
      socket.off("user:challenge_progress", handleChallengeProgress);
    };
  }, [socket, queryClient]);
}
