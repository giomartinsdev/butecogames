import { useState, useEffect } from "react";
import { getNumberColor } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

interface RouletteWheelProps {
  result: number | null;
  spinning: boolean;
}

export function RouletteWheel({ result, spinning }: RouletteWheelProps) {
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);

  // Cycle through random numbers when spinning
  useEffect(() => {
    if (!spinning) {
      setDisplayNumber(result);
      return;
    }

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * WHEEL_ORDER.length);
      setDisplayNumber(WHEEL_ORDER[randomIndex]);
    }, 100); // Change number every 100ms

    return () => clearInterval(interval);
  }, [spinning, result]);
  const colorMap = {
    red: "bg-roulette-red",
    black: "bg-roulette-black",
    green: "bg-roulette-green",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-40 w-40">
        {/* Spinning wheel background */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-300",
            spinning
              ? "animate-spin"
              : result !== null
                ? `${colorMap[getNumberColor(result)]}`
                : "bg-card border-border"
          )}
          style={{
            background: spinning
              ? "conic-gradient(from 0deg, #dc2626 0deg 60deg, #1a1a2e 60deg 120deg, #dc2626 120deg 180deg, #1a1a2e 180deg 240deg, #dc2626 240deg 300deg, #1a1a2e 300deg 360deg)"
              : undefined
          }}
        />

        {/* Center display */}
        <div
          className={cn(
            "absolute inset-4 flex items-center justify-center rounded-full text-4xl font-bold shadow-lg transition-all duration-100",
            displayNumber !== null
              ? colorMap[getNumberColor(displayNumber)]
              : "bg-card",
            spinning ? "" : "",
          )}
        >
          {displayNumber !== null ? displayNumber : ""}
        </div>
      </div>
    </div>
  );
}
