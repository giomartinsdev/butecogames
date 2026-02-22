import type { UnoCardColor } from "@butecogames/shared";
import { UNO_COLOR_HEX } from "@butecogames/shared";

interface UnoColorPickerProps {
  onSelect: (color: UnoCardColor) => void;
  onCancel: () => void;
}

const COLORS: { color: UnoCardColor; label: string }[] = [
  { color: "red", label: "Vermelho" },
  { color: "blue", label: "Azul" },
  { color: "green", label: "Verde" },
  { color: "yellow", label: "Amarelo" },
];

export function UnoColorPicker({ onSelect, onCancel }: UnoColorPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h3 className="mb-4 text-center text-lg font-bold text-card-foreground">
          Escolha uma cor
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              onClick={() => onSelect(color)}
              className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-white/30 text-sm font-bold text-white shadow-lg transition-transform hover:scale-110 hover:border-white/60"
              style={{ backgroundColor: UNO_COLOR_HEX[color] }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 w-full rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/80"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
