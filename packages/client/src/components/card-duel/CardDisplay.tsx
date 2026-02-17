import { useEffect, useState } from "react";
import type { Card } from "@butecogames/shared";
import { RANK_NAMES, SUIT_SYMBOLS } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

interface CardDisplayProps {
  card: Card | null;
  faceDown?: boolean;
  highlight?: "win" | "lose" | "draw" | null;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
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
  animate = false,
}: CardDisplayProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (animate && card && !faceDown) {
      // Trigger flip animation
      setIsFlipped(false);
      const timer = setTimeout(() => setIsFlipped(true), 50);
      return () => clearTimeout(timer);
    }
    if (faceDown || !card) {
      setIsFlipped(false);
    }
  }, [card?.rank, card?.suit, faceDown, animate]);

  const sizeClasses = {
    sm: "h-24 w-16 text-lg",
    md: "h-36 w-24 text-2xl",
    lg: "h-48 w-32 text-3xl",
  };

  const showFace = card && !faceDown && (!animate || isFlipped);

  const highlightBorder = {
    win: "border-green-500 ring-2 ring-green-500/50",
    lose: "border-red-500 ring-2 ring-red-500/50",
    draw: "border-yellow-500 ring-2 ring-yellow-500/50",
    null: "",
  };

  // Card back
  const backFace = (
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

  if (!card || (faceDown && !animate)) {
    return backFace;
  }

  const rankName = RANK_NAMES[card.rank] ?? String(card.rank);
  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? "";
  const suitColor = getSuitColor(card.suit);

  // Card face
  const frontFace = (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 bg-white shadow-lg dark:bg-zinc-800",
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

  if (!animate) {
    return frontFace;
  }

  // Flip animation wrapper
  return (
    <div className={cn("relative", sizeClasses[size])} style={{ perspective: "600px" }}>
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: showFace ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back side */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden" }}
        >
          {backFace}
        </div>
        {/* Front side */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {frontFace}
        </div>
      </div>
    </div>
  );
}
