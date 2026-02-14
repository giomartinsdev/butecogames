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
  const colorMap = {
    red: "bg-roulette-red",
    black: "bg-roulette-black",
    green: "bg-roulette-green",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "flex h-32 w-32 items-center justify-center rounded-full border-4 border-accent text-4xl font-bold transition-all duration-500",
          result !== null
            ? colorMap[getNumberColor(result)]
            : "bg-card",
          spinning && "animate-pulse border-primary",
        )}
      >
        {spinning ? "?" : result !== null ? result : "-"}
      </div>

      {/* Recent results strip */}
      <div className="flex gap-1">
        {WHEEL_ORDER.slice(0, 15).map((n) => {
          const color = getNumberColor(n);
          return (
            <div
              key={n}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded text-[10px] font-medium text-white",
                colorMap[color],
              )}
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}
