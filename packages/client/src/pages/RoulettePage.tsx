import { RouletteGame } from "@/components/roulette/RoulettePage.js";

export function RoulettePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Roleta</h1>
        <p className="mt-1 text-muted-foreground">
          Aposte em cores, numeros ou combinacoes na roleta europeia
        </p>
      </div>
      <RouletteGame />
    </div>
  );
}
