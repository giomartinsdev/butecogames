import type { RouletteBetType } from "@butecogames/shared";
import { translateBetType } from "@/lib/utils.js";
import { BetAmountInput } from "@/components/ui/BetAmountInput.js";

interface BetControlsProps {
  onPlaceBet: (betType: RouletteBetType, amount: number) => void;
  selectedBet: RouletteBetType | null;
  disabled: boolean;
  minBet: number;
  maxBet: number;
}

export function BetControls({ onPlaceBet, selectedBet, disabled, minBet, maxBet }: BetControlsProps) {
  return (
    <BetAmountInput
      minBet={minBet}
      maxBet={maxBet}
      disabled={disabled}
      hasSelection={!!selectedBet}
      onPlaceBet={(amount) => onPlaceBet(selectedBet!, amount)}
      placeholderText="Selecione uma aposta"
    >
      {/* {selectedBet && (
        <p className="text-center text-xs text-muted-foreground">
          Aposta selecionada: <span className="font-medium text-card-foreground">{translateBetType(selectedBet)}</span>
        </p>
      )} */}
    </BetAmountInput>
  );
}
