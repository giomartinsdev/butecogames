import { getNumberColor } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

const colorMap = {
  red: "bg-roulette-red",
  black: "bg-roulette-black",
  green: "bg-roulette-green",
};

export function RoundHistory({ results }: { results: number[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Resultados anteriores
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {results.map((n, i) => {
          const color = getNumberColor(n);
          return (
            <div
              key={i}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded text-xs font-bold text-white",
                colorMap[color],
              )}
            >
              {n}
            </div>
          );
        })}
        {results.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum resultado ainda</p>
        )}
      </div>
    </div>
  );
}
