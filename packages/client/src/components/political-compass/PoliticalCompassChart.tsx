import type { PoliticalCompassResult } from "@butecogames/shared";

interface Props {
  economicScore: number;
  socialScore: number;
  allResults?: PoliticalCompassResult[];
  highlightedUserId?: string | null;
}

export function PoliticalCompassChart({
  economicScore,
  socialScore,
  allResults,
  highlightedUserId,
}: Props) {
  // Convert score (-10 to +10) to percentage (0% to 100%)
  // X axis: -10 (left) = 0%, +10 (right) = 100%
  const toPercentX = (score: number) => ((score + 10) / 20) * 100;
  // Y axis: +10 (authoritarian) = 0% (top), -10 (libertarian) = 100% (bottom)
  const toPercentY = (score: number) => ((10 - score) / 20) * 100;

  const userX = toPercentX(economicScore);
  const userY = toPercentY(socialScore);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mx-auto flex flex-col items-center" style={{ maxWidth: 540 }}>
        {/* Top label */}
        <span className="mb-1 text-xs font-medium text-muted-foreground">
          Autoritário
        </span>

        <div className="flex items-center w-full">
          {/* Left label */}
          <span className="mr-2 text-xs font-medium text-muted-foreground shrink-0">
            Esquerda
          </span>

          {/* Chart */}
          <div className="relative flex-1" style={{ aspectRatio: "1/1" }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Quadrant fills */}
              <rect
                x="0"
                y="0"
                width="50"
                height="50"
                fill="rgba(239,68,68,0.08)"
              />
              <rect
                x="50"
                y="0"
                width="50"
                height="50"
                fill="rgba(59,130,246,0.08)"
              />
              <rect
                x="0"
                y="50"
                width="50"
                height="50"
                fill="rgba(34,197,94,0.08)"
              />
              <rect
                x="50"
                y="50"
                width="50"
                height="50"
                fill="rgba(168,85,247,0.08)"
              />

              {/* Axis lines */}
              <line
                x1="50"
                y1="0"
                x2="50"
                y2="100"
                stroke="currentColor"
                strokeWidth="0.3"
                opacity="0.3"
              />
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="currentColor"
                strokeWidth="0.3"
                opacity="0.3"
              />

              {/* Border */}
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.2"
              />

              {/* Other users' dots */}
              {allResults?.map((r) => {
                const isHighlighted = highlightedUserId === r.userId;
                return (
                  <circle
                    key={r.userId}
                    cx={toPercentX(r.economicScore)}
                    cy={toPercentY(r.socialScore)}
                    r={isHighlighted ? 3 : 1.5}
                    fill={isHighlighted ? "#3b82f6" : "currentColor"}
                    opacity={highlightedUserId ? (isHighlighted ? 1 : 0.1) : 0.2}
                    stroke={isHighlighted ? "#fff" : "none"}
                    strokeWidth={isHighlighted ? 0.5 : 0}
                    style={{ transition: "all 150ms ease" }}
                  />
                );
              })}

              {/* User's dot */}
              <circle
                cx={userX}
                cy={userY}
                r="3"
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth="0.5"
              />
            </svg>
          </div>

          {/* Right label */}
          <span className="ml-2 text-xs font-medium text-muted-foreground shrink-0">
            Direita
          </span>
        </div>

        {/* Bottom label */}
        <span className="mt-1 text-xs font-medium text-muted-foreground">
          Libertário
        </span>
      </div>

      {/* Score display */}
      <div className="mt-4 flex justify-center gap-8 text-sm">
        <div>
          <span className="text-muted-foreground">Econômico: </span>
          <span className="font-medium text-card-foreground">
            {economicScore > 0 ? "+" : ""}
            {economicScore.toFixed(2)}
          </span>
          <span className="text-muted-foreground ml-1">
            (
            {economicScore < 0
              ? "Esquerda"
              : economicScore > 0
                ? "Direita"
                : "Centro"}
            )
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Social: </span>
          <span className="font-medium text-card-foreground">
            {socialScore > 0 ? "+" : ""}
            {socialScore.toFixed(2)}
          </span>
          <span className="text-muted-foreground ml-1">
            (
            {socialScore > 0
              ? "Autoritário"
              : socialScore < 0
                ? "Libertário"
                : "Centro"}
            )
          </span>
        </div>
      </div>
    </div>
  );
}
