import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { PoliticalCompassResult } from "@butecogames/shared";
import { DataTable } from "@/components/ui/DataTable.js";

interface Props {
  results: PoliticalCompassResult[];
  isLoading: boolean;
  onUserClick?: (user: PoliticalCompassResult) => void;
  onUserHover?: (user: PoliticalCompassResult | null) => void;
}

function getQuadrant(economicScore: number, socialScore: number): string {
  if (economicScore <= 0 && socialScore > 0) return "Esq. Autoritária";
  if (economicScore > 0 && socialScore > 0) return "Dir. Autoritária";
  if (economicScore <= 0 && socialScore <= 0) return "Esq. Libertária";
  return "Dir. Libertária";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PoliticalCompassResultsTable({ results, isLoading, onUserClick, onUserHover }: Props) {
  const columns = useMemo<ColumnDef<PoliticalCompassResult, any>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Membro",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                {row.original.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-card-foreground">
              {row.original.displayName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "economicScore",
        header: "Econômico",
        cell: ({ getValue }) => {
          const score = getValue<number>();
          return (
            <span className="font-medium text-card-foreground">
              {score > 0 ? "+" : ""}
              {score.toFixed(2)}
              <span className="ml-1 text-xs text-muted-foreground">
                (
                {score < -3
                  ? "Esquerda"
                  : score > 3
                    ? "Direita"
                    : "Centro"}
                )
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "socialScore",
        header: "Social",
        cell: ({ getValue }) => {
          const score = getValue<number>();
          return (
            <span className="font-medium text-card-foreground">
              {score > 0 ? "+" : ""}
              {score.toFixed(2)}
              <span className="ml-1 text-xs text-muted-foreground">
                (
                {score > 3
                  ? "Autoritário"
                  : score < -3
                    ? "Libertário"
                    : "Centro"}
                )
              </span>
            </span>
          );
        },
      },
      {
        id: "quadrant",
        header: "Quadrante",
        cell: ({ row }) => {
          const { economicScore, socialScore } = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {getQuadrant(economicScore, socialScore)}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Data",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
    ],
    [],
  );

  // Group results by year (results are already sorted by updatedAt desc)
  const groupedByYear = useMemo(() => {
    const groups: { year: number; results: PoliticalCompassResult[] }[] = [];
    for (const result of results) {
      const year = new Date(result.updatedAt).getFullYear();
      const last = groups[groups.length - 1];
      if (last && last.year === year) {
        last.results.push(result);
      } else {
        groups.push({ year, results: [result] });
      }
    }
    return groups;
  }, [results]);

  if (isLoading) {
    return (
      <DataTable
        columns={columns}
        data={[]}
        isLoading
        emptyMessage="Nenhum membro completou o teste ainda"
      />
    );
  }

  if (results.length === 0) {
    return (
      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Nenhum membro completou o teste ainda"
      />
    );
  }

  return (
    <div className="space-y-6">
      {groupedByYear.map(({ year, results: yearResults }) => (
        <div key={year} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{year}</h3>
          <DataTable
            columns={columns}
            data={yearResults}
            pageSize={10}
            onRowClick={onUserClick}
            onRowHover={onUserHover}
            emptyMessage="Nenhum membro completou o teste ainda"
          />
        </div>
      ))}
    </div>
  );
}
