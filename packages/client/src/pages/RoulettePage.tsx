import { RouletteGame } from "@/components/roulette/RoulettePage.js";

export function RoulettePage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Roleta</h1>
        <p className="mt-1 text-muted-foreground"></p>
      </div>
      <RouletteGame />
    </div>
  );
}
