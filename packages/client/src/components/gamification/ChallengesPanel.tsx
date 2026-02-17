import { useChallenges } from "@/hooks/useGamification.js";
import { formatCoins } from "@/lib/utils.js";
import { Check, Clock } from "lucide-react";

function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expirado";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function ChallengesPanel() {
  const { data, isLoading } = useChallenges();
  const challenges = data?.challenges ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Carregando desafios...</p>
      </div>
    );
  }

  if (challenges.length === 0) return null;

  const daily = challenges.filter((c) => c.period === "daily");
  const weekly = challenges.filter((c) => c.period === "weekly");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-card-foreground">Desafios</h2>

      {daily.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Diários</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              {formatTimeRemaining(daily[0].expiresAt)}
            </span>
          </div>
          {daily.map((c) => (
            <ChallengeCard key={c._id} challenge={c} />
          ))}
        </div>
      )}

      {weekly.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Semanal</h3>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              {formatTimeRemaining(weekly[0].expiresAt)}
            </span>
          </div>
          {weekly.map((c) => (
            <ChallengeCard key={c._id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: { _id: string; name: string; description: string; progress: number; target: number; completed: boolean; rewardCoins: number; rewardXp: number } }) {
  const progress = Math.min(challenge.progress, challenge.target);
  const pct = Math.round((progress / challenge.target) * 100);

  return (
    <div className={`rounded-xl border p-3 ${challenge.completed ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${challenge.completed ? "text-accent" : "text-card-foreground"}`}>
              {challenge.name}
            </p>
            {challenge.completed && <Check size={14} className="text-accent shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-medium text-accent">+{formatCoins(challenge.rewardCoins)}</p>
          <p className="text-xs text-muted-foreground">+{challenge.rewardXp} XP</p>
        </div>
      </div>

      {!challenge.completed && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">
              {progress} / {challenge.target}
            </span>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
