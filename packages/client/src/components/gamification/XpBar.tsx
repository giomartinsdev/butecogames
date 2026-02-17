import { useEffect, useState, useCallback } from "react";
import { useLevelInfo } from "@/hooks/useGamification.js";

let floatId = 0;

export function XpBar() {
  const { data: levelInfo } = useLevelInfo();
  const [floats, setFloats] = useState<{ id: number; xp: number }[]>([]);

  const handleXpGained = useCallback((e: Event) => {
    const { xpGained } = (e as CustomEvent<{ xpGained: number }>).detail;
    if (xpGained <= 0) return;
    const id = ++floatId;
    setFloats((prev) => [...prev, { id, xp: xpGained }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1500);
  }, []);

  useEffect(() => {
    window.addEventListener("xp:gained", handleXpGained);
    return () => window.removeEventListener("xp:gained", handleXpGained);
  }, [handleXpGained]);

  if (!levelInfo) return null;

  return (
    <div
      className="relative flex items-center gap-2"
      title={`${levelInfo.currentXp} / ${levelInfo.xpForNextLevel} XP`}
    >
      <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
        Lv. {levelInfo.level}
      </span>
      <div className="hidden sm:block w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
        />
      </div>

      {/* Floating XP notifications */}
      {floats.map((f) => (
        <span
          key={f.id}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-bold text-accent animate-xp-float"
        >
          +{f.xp} XP
        </span>
      ))}
    </div>
  );
}
