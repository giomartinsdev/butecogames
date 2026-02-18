import { useState } from "react";
import type {
  PoliticalCompassQuestion,
  PoliticalCompassAnswer,
  PoliticalCompassPage,
  LikertAnswer,
} from "@butecogames/shared";
import { LIKERT_OPTIONS, POLITICAL_COMPASS_PAGES } from "@butecogames/shared";
import { cn } from "@/lib/utils.js";

interface Props {
  questions: PoliticalCompassQuestion[];
  onSubmit: (answers: PoliticalCompassAnswer[]) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function PoliticalCompassSurvey({
  questions,
  onSubmit,
  isSubmitting,
  onCancel,
}: Props) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, LikertAnswer>>(new Map());

  const pages = POLITICAL_COMPASS_PAGES;
  const currentPage = pages[currentPageIndex];
  const pageQuestions = currentPage.questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is PoliticalCompassQuestion => q != null);

  const answeredCount = answers.size;
  const totalCount = questions.length;
  const allAnswered = answeredCount === totalCount;
  const allPageAnswered = pageQuestions.every((q) => answers.has(q.id));

  function handleAnswer(questionId: number, value: LikertAnswer) {
    setAnswers((prev) => new Map(prev).set(questionId, value));
  }

  function handleSubmit() {
    const answerArray: PoliticalCompassAnswer[] = Array.from(
      answers.entries(),
    ).map(([questionId, answer]) => ({ questionId, answer }));
    onSubmit(answerArray);
  }

  function getPageAnsweredCount(page: PoliticalCompassPage) {
    return page.questionIds.filter((id) => answers.has(id)).length;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            Página {currentPageIndex + 1} de {pages.length}
          </span>
          <span>{answeredCount}/{totalCount} respondidas</span>
        </div>
        <div className="h-2 rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${(answeredCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex flex-wrap gap-2">
        {pages.map((page, i) => {
          const pageAnswered = getPageAnsweredCount(page);
          const pageTotal = page.questionIds.length;
          const isComplete = pageAnswered === pageTotal;
          return (
            <button
              key={page.page}
              onClick={() => setCurrentPageIndex(i)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                i === currentPageIndex
                  ? "border-primary bg-primary/10 text-primary"
                  : isComplete
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-muted-foreground",
              )}
            >
              {page.title}
              <span className="ml-1 text-[10px] opacity-70">
                {pageAnswered}/{pageTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Page title */}
      <h3 className="text-lg font-semibold text-card-foreground">
        {currentPage.title}
      </h3>

      {/* Questions */}
      <div className="space-y-6">
        {pageQuestions.map((question, qIndex) => (
          <div key={question.id} className="space-y-2">
            <p className="text-sm text-card-foreground font-medium">
              <span className="text-muted-foreground mr-2">
                {question.id + 1}.
              </span>
              {question.text}
            </p>
            <div className="flex flex-wrap gap-2">
              {LIKERT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(question.id, option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    answers.get(question.id) === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-card-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation and submit */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPageIndex((i) => Math.max(0, i - 1))}
            disabled={currentPageIndex === 0}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() =>
              setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1))
            }
            disabled={currentPageIndex === pages.length - 1}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground hover:text-card-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Ver Resultado"}
          </button>
        </div>
      </div>
    </div>
  );
}
