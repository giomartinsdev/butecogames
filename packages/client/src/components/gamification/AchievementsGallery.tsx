import { useAchievements, useMyAchievements } from "@/hooks/useGamification.js";
import { formatCoins } from "@/lib/utils.js";
import { Lock, Check } from "lucide-react";
import type { AchievementCategory } from "@butecogames/shared";

const categoryLabels: Record<AchievementCategory, string> = {
  betting: "Apostas",
  winning: "Vitórias",
  social: "Social",
  milestone: "Marcos",
  challenge: "Desafios",
};

const categoryOrder: AchievementCategory[] = ["betting", "winning", "milestone", "social", "challenge"];

export function AchievementsGallery() {
  const { data: allData } = useAchievements();
  const { data: myData } = useMyAchievements();

  const achievements = allData?.achievements ?? [];
  const unlocked = new Set(myData?.achievements ?? []);

  if (achievements.length === 0) return null;

  // Group by category
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: achievements.filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-card-foreground">Conquistas</h2>
        <span className="text-sm text-muted-foreground">
          {unlocked.size} / {achievements.length}
        </span>
      </div>

      {grouped.map((group) => (
        <div key={group.category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.items.map((achievement) => {
              const isUnlocked = unlocked.has(achievement.id);
              return (
                <div
                  key={achievement.id}
                  className={`relative rounded-xl border p-3 transition-colors ${
                    isUnlocked
                      ? "border-accent/30 bg-accent/5"
                      : "border-border bg-card opacity-60"
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <Check size={14} className="text-accent" />
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock size={12} className="text-muted-foreground" />
                    </div>
                  )}
                  <p className={`text-sm font-medium ${isUnlocked ? "text-card-foreground" : "text-muted-foreground"}`}>
                    {achievement.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {achievement.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-accent">
                    +{formatCoins(achievement.reward)} coins
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
