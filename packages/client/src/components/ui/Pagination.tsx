import { cn } from "@/lib/utils.js";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className={cn(
          "rounded-md border border-border px-3 py-1 text-sm text-card-foreground transition-colors",
          page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-muted",
        )}
      >
        Anterior
      </button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {pageCount}
      </span>
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className={cn(
          "rounded-md border border-border px-3 py-1 text-sm text-card-foreground transition-colors",
          page === pageCount ? "opacity-50 cursor-not-allowed" : "hover:bg-muted",
        )}
      >
        Próxima
      </button>
    </div>
  );
}
