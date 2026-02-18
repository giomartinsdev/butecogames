import { useState } from "react";
import {
  usePoliticalCompassQuestions,
  useMyPoliticalCompassResult,
  useAllPoliticalCompassResults,
  useSubmitPoliticalCompass,
} from "@/hooks/usePoliticalCompass.js";
import { PoliticalCompassSurvey } from "@/components/political-compass/PoliticalCompassSurvey.js";
import { PoliticalCompassChart } from "@/components/political-compass/PoliticalCompassChart.js";
import { PoliticalCompassResultsTable } from "@/components/political-compass/PoliticalCompassResultsTable.js";
import { PoliticalCompassAnswersModal } from "@/components/political-compass/PoliticalCompassAnswersModal.js";
import type { PoliticalCompassAnswer, PoliticalCompassResult } from "@butecogames/shared";
import { toast } from "sonner";
import { useSoundStore } from "@/stores/soundStore.js";

export function PoliticalCompassPage() {
  const { data: questionsData, isLoading: loadingQuestions } =
    usePoliticalCompassQuestions();
  const { data: myResultData, isLoading: loadingMyResult } =
    useMyPoliticalCompassResult();
  const { data: allResultsData, isLoading: loadingAllResults } =
    useAllPoliticalCompassResults();
  const submitMutation = useSubmitPoliticalCompass();
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Pick<PoliticalCompassResult, "userId" | "displayName" | "image" | "economicScore" | "socialScore"> | null>(null);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  const hasResult = myResultData?.result != null;

  const canRetake = (() => {
    if (!myResultData?.result?.updatedAt) return true;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(myResultData.result.updatedAt) <= sixMonthsAgo;
  })();

  const retakeDate = (() => {
    if (!myResultData?.result?.updatedAt || canRetake) return null;
    const next = new Date(myResultData.result.updatedAt);
    next.setMonth(next.getMonth() + 6);
    return next.toLocaleDateString("pt-BR");
  })();

  const showingSurvey = showSurvey || !hasResult;

  const handleSubmit = async (answers: PoliticalCompassAnswer[]) => {
    try {
      const data = await submitMutation.mutateAsync(answers);
      setShowSurvey(false);
      toast.success("Resultado salvo com sucesso!");

      if (data.result) {
        const { economicScore } = data.result;
        if (economicScore > 0) {
          useSoundStore.getState().playSound("direita_autoritaria");
        } else if (economicScore < 0) {
          useSoundStore.getState().playSound("esquerda_autoritaria");
        }
        // centro: no sound for now
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar resultado");
    }
  };

  if (loadingQuestions || loadingMyResult) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">
          Bússola Política
        </h1>
        <p className="mt-1 text-muted-foreground">
          Descubra seu posicionamento no espectro político
        </p>
      </div>

      {showingSurvey && questionsData?.questions ? (
        <PoliticalCompassSurvey
          questions={questionsData.questions}
          onSubmit={handleSubmit}
          isSubmitting={submitMutation.isPending}
          onCancel={hasResult ? () => setShowSurvey(false) : undefined}
        />
      ) : (
        <>
          {myResultData?.result && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-card-foreground">
                Seu Resultado
              </h2>
              <div className="flex items-center gap-3">
                {!canRetake && retakeDate && (
                  <span className="text-xs text-muted-foreground">
                    Disponível em {retakeDate}
                  </span>
                )}
                <button
                  onClick={() => setShowSurvey(true)}
                  disabled={!canRetake}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Refazer Teste
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Chart */}
            {myResultData?.result && (
              <div className="lg:sticky lg:top-20 lg:self-start">
                <PoliticalCompassChart
                  economicScore={myResultData.result.economicScore}
                  socialScore={myResultData.result.socialScore}
                  allResults={allResultsData?.results}
                  highlightedUserId={hoveredUserId}
                />
              </div>
            )}

            {/* Right: Results table */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-card-foreground">
                Resultados da Comunidade
              </h2>
              <PoliticalCompassResultsTable
                results={allResultsData?.results ?? []}
                isLoading={loadingAllResults}
                onUserClick={(user) => setSelectedUser(user)}
                onUserHover={(user) => setHoveredUserId(user?.userId ?? null)}
              />
            </div>
          </div>
        </>
      )}

      <PoliticalCompassAnswersModal
        open={selectedUser != null}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  );
}
