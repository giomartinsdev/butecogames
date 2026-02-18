import { useState } from "react";
import { useUserPoliticalCompassResult } from "@/hooks/usePoliticalCompass.js";
import {
  POLITICAL_COMPASS_QUESTIONS,
  POLITICAL_COMPASS_PAGES,
  LIKERT_OPTIONS,
} from "@butecogames/shared";
import type { PoliticalCompassResult } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  user: Pick<PoliticalCompassResult, "userId" | "displayName" | "image" | "economicScore" | "socialScore"> | null;
}

function getQuadrant(economicScore: number, socialScore: number): string {
  if (economicScore <= 0 && socialScore > 0) return "Esq. Autoritária";
  if (economicScore > 0 && socialScore > 0) return "Dir. Autoritária";
  if (economicScore <= 0 && socialScore <= 0) return "Esq. Libertária";
  return "Dir. Libertária";
}

function getAnswerLabel(value: number): string {
  const option = LIKERT_OPTIONS.find((o) => o.value === value);
  return option?.label ?? String(value);
}

export function PoliticalCompassAnswersModal({ open, onClose, user }: Props) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const { data, isLoading } = useUserPoliticalCompassResult(
    open && user ? user.userId : null,
  );

  if (!open || !user) return null;

  const result = data?.result;
  const answersMap = new Map(
    result?.answers?.map((a) => [a.questionId, a.answer]) ?? [],
  );

  const pages = POLITICAL_COMPASS_PAGES;
  const currentPage = pages[currentPageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[85vh] rounded-xl border border-border bg-card shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-300">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-card-foreground">
                {user.displayName}
              </h2>
              <p className="text-xs text-muted-foreground">
                {getQuadrant(user.economicScore, user.socialScore)}
                {" · "}
                Econômico: {user.economicScore > 0 ? "+" : ""}{user.economicScore.toFixed(2)}
                {" · "}
                Social: {user.socialScore > 0 ? "+" : ""}{user.socialScore.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-card-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">
              Carregando...
            </p>
          ) : !result?.answers?.length ? (
            <p className="text-muted-foreground text-center py-8">
              Respostas não disponíveis
            </p>
          ) : (
            <div className="space-y-6">
              {/* Page tabs */}
              <div className="flex flex-wrap gap-2">
                {pages.map((page, i) => (
                  <button
                    key={page.page}
                    onClick={() => setCurrentPageIndex(i)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                      i === currentPageIndex
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground",
                    )}
                  >
                    {page.title}
                  </button>
                ))}
              </div>

              {/* Page title */}
              <h3 className="text-sm font-semibold text-accent">
                {currentPage.title}
              </h3>

              {/* Questions for current page */}
              <div className="space-y-3">
                {currentPage.questionIds.map((qId) => {
                  const question = POLITICAL_COMPASS_QUESTIONS.find(
                    (q) => q.id === qId,
                  );
                  if (!question) return null;
                  const answer = answersMap.get(qId);
                  return (
                    <div
                      key={qId}
                      className="rounded-lg bg-muted px-4 py-3"
                    >
                      <p className="text-sm text-card-foreground">
                        <span className="text-muted-foreground mr-1.5">
                          {qId + 1}.
                        </span>
                        {question.text}
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-primary">
                        {answer != null
                          ? getAnswerLabel(answer)
                          : "Sem resposta"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
