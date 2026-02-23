import type { UnecoCard as UnecoCardType, AnyCardColor } from "@butecogames/shared";
import { UNECO_COLOR_HEX } from "@butecogames/shared";

interface UnecoCardProps {
  card: UnecoCardType;
  size?: "sm" | "md" | "lg";
  playable?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  /** When true, applies random rotation for pile effect */
  rotation?: number;
}

const VALUE_DISPLAY: Record<string, string> = {
  skip: "⊘",
  reverse: "⟲",
  "+2": "+2",
  wild: "★",
  "+4": "+4",
};

function getCardBg(color: AnyCardColor): string {
  if (color === "wild") {
    return "bg-gradient-to-br from-red-500 via-blue-500 to-green-500";
  }
  return "";
}

function getCardStyle(color: AnyCardColor, rotation?: number): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (color !== "wild") {
    style.backgroundColor = UNECO_COLOR_HEX[color] ?? "#666";
  }
  if (rotation !== undefined) {
    style.transform = `rotate(${rotation}deg)`;
  }
  return style;
}

const SIZE_CLASSES = {
  sm: "w-10 h-14 text-xs rounded",
  md: "w-16 h-24 text-lg rounded-lg",
  lg: "w-20 h-28 text-xl rounded-lg",
};

export function UnecoCard({
  card,
  size = "md",
  playable = false,
  faceDown = false,
  onClick,
  rotation,
}: UnecoCardProps) {
  if (faceDown) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} flex items-center justify-center border-2 border-white/20 bg-gray-700 font-bold text-white shadow-md cursor-default select-none`}
        style={rotation !== undefined ? { transform: `rotate(${rotation}deg)` } : undefined}
      >
        <span className="text-2xl">?</span>
      </div>
    );
  }

  const display = VALUE_DISPLAY[card.value] ?? card.value;
  const bgClass = getCardBg(card.color);
  const bgStyle = getCardStyle(card.color, rotation);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!playable && !onClick}
      className={`
        ${SIZE_CLASSES[size]}
        ${bgClass}
        relative flex flex-col items-center justify-center
        border-2 font-bold text-white shadow-md select-none
        transition-all duration-150
        ${playable
          ? "border-white/80 cursor-pointer ring-2 ring-white/40"
          : "border-white/20 cursor-default"
        }
        ${onClick && !playable ? "cursor-pointer hover:opacity-80" : ""}
      `}
      style={bgStyle}
    >
      <span className="absolute top-0.5 left-1 text-[0.6em] font-semibold drop-shadow">
        {display}
      </span>
      <span className="text-center font-extrabold drop-shadow-md">
        {display}
      </span>
      <span className="absolute bottom-0.5 right-1 rotate-180 text-[0.6em] font-semibold drop-shadow">
        {display}
      </span>
    </button>
  );
}
