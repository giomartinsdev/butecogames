import type { Card } from "@butecogames/shared";
import { RANK_NAMES, SUIT_SYMBOLS } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

interface CardDisplayProps {
  card: Card | null;
  faceDown?: boolean;
  highlight?: "win" | "lose" | "draw" | null;
  size?: "sm" | "md" | "lg";
}

function getSuitColor(suit: string): string {
  return suit === "hearts" || suit === "diamonds"
    ? "text-red-500"
    : "text-zinc-900 dark:text-zinc-100";
}

export function CardDisplay({
  card,
  faceDown = false,
  highlight = null,
  size = "md",
}: CardDisplayProps) {
  const sizeClasses = {
    sm: "h-24 w-16 text-lg",
    md: "h-36 w-24 text-2xl",
    lg: "h-48 w-32 text-3xl",
  };

  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border-2 border-zinc-600",
          "bg-gradient-to-br from-blue-800 to-blue-900 shadow-lg",
          sizeClasses[size],
        )}
      >
        <div className="text-3xl text-blue-400/50">?</div>
      </div>
    );
  }

  const rankName = RANK_NAMES[card.rank] ?? String(card.rank);
  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? "";
  const suitColor = getSuitColor(card.suit);

  const highlightBorder = {
    win: "border-green-500 ring-2 ring-green-500/50",
    lose: "border-red-500 ring-2 ring-red-500/50",
    draw: "border-yellow-500 ring-2 ring-yellow-500/50",
    null: "border-zinc-300 dark:border-zinc-600",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 bg-white shadow-lg transition-all duration-300 dark:bg-zinc-800",
        sizeClasses[size],
        highlightBorder[highlight ?? "null"],
      )}
    >
      {/* Top-left rank + suit */}
      <div className={cn("absolute left-1.5 top-1 text-xs font-bold", suitColor)}>
        <div>{rankName}</div>
        <div className="-mt-0.5">{suitSymbol}</div>
      </div>

      {/* Center */}
      <div className={cn("font-bold", suitColor)}>
        <span className="text-[1.5em]">{rankName}</span>
        <span className="ml-0.5">{suitSymbol}</span>
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      <div
        className={cn(
          "absolute bottom-1 right-1.5 rotate-180 text-xs font-bold",
          suitColor,
        )}
      >
        <div>{rankName}</div>
        <div className="-mt-0.5">{suitSymbol}</div>
      </div>
    </div>
  );
}
