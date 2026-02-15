import { getNumberColor } from "@butecogames/shared";
import type { RouletteBetType } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

interface BettingBoardProps {
  onBet: (betType: RouletteBetType) => void;
  disabled: boolean;
}

const colorMap = {
  red: "bg-roulette-red hover:bg-roulette-red/80",
  black: "bg-roulette-black hover:bg-roulette-black/80 border border-gray-600",
  green: "bg-roulette-green hover:bg-roulette-green/80",
};

export function BettingBoard({ onBet, disabled }: BettingBoardProps) {
  return (
    <div className="space-y-3">
      {/* Zero */}
      <div className="flex justify-center">
        <button
          onClick={() => onBet("number:0")}
          disabled={disabled}
          className={cn(
            "h-10 w-16 rounded text-sm font-bold text-white transition-colors disabled:opacity-40",
            colorMap.green,
          )}
        >
          0
        </button>
      </div>

      {/* Number grid: 3 rows x 12 columns */}
      <div className="space-y-1">
        {/* Row 1: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36 */}
        <div className="grid grid-cols-12 gap-1">
          {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map((n) => {
            const color = getNumberColor(n);
            return (
              <button
                key={n}
                onClick={() => onBet(`number:${n}` as RouletteBetType)}
                disabled={disabled}
                className={cn(
                  "h-10 rounded text-xs font-bold text-white transition-colors disabled:opacity-40 cursor-pointer",
                  colorMap[color],
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        {/* Row 2: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35 */}
        <div className="grid grid-cols-12 gap-1">
          {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map((n) => {
            const color = getNumberColor(n);
            return (
              <button
                key={n}
                onClick={() => onBet(`number:${n}` as RouletteBetType)}
                disabled={disabled}
                className={cn(
                  "h-10 rounded text-xs font-bold text-white transition-colors disabled:opacity-40 cursor-pointer",
                  colorMap[color],
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        {/* Row 3: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34 */}
        <div className="grid grid-cols-12 gap-1">
          {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map((n) => {
            const color = getNumberColor(n);
            return (
              <button
                key={n}
                onClick={() => onBet(`number:${n}` as RouletteBetType)}
                disabled={disabled}
                className={cn(
                  "h-10 rounded text-xs font-bold text-white transition-colors disabled:opacity-40 cursor-pointer",
                  colorMap[color],
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outside bets */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onBet("dozen:1")}
          disabled={disabled}
          className="rounded border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          1-12
        </button>
        <button
          onClick={() => onBet("dozen:2")}
          disabled={disabled}
          className="rounded border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          13-24
        </button>
        <button
          onClick={() => onBet("dozen:3")}
          disabled={disabled}
          className="rounded border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          25-36
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        <button
          onClick={() => onBet("low")}
          disabled={disabled}
          className="rounded border border-border bg-card px-2 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          1-18
        </button>
        <button
          onClick={() => onBet("even")}
          disabled={disabled}
          className="rounded border border-border bg-card px-2 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          Par
        </button>
        <button
          onClick={() => onBet("red")}
          disabled={disabled}
          className="rounded bg-roulette-red px-2 py-2 text-sm font-medium text-white hover:bg-roulette-red/80 transition-colors disabled:opacity-40 cursor-pointer"
        >
          Verm.
        </button>
        <button
          onClick={() => onBet("black")}
          disabled={disabled}
          className="rounded bg-roulette-black border border-gray-600 px-2 py-2 text-sm font-medium text-white hover:bg-roulette-black/80 transition-colors disabled:opacity-40 cursor-pointer"
        >
          Preto
        </button>
        <button
          onClick={() => onBet("odd")}
          disabled={disabled}
          className="rounded border border-border bg-card px-2 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          Impar
        </button>
        <button
          onClick={() => onBet("high")}
          disabled={disabled}
          className="rounded border border-border bg-card px-2 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer"
        >
          19-36
        </button>
      </div>
    </div>
  );
}
