import type { PoliticalCompassAnswer, PoliticalCompassQuestion } from "./types.js";

export function calculatePoliticalCompass(
  answers: PoliticalCompassAnswer[],
  questions: PoliticalCompassQuestion[],
): { economicScore: number; socialScore: number } {
  let economicSum = 0;
  let socialSum = 0;

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const answerIndex = answer.answer; // 0-3
    economicSum += question.scoring.economic[answerIndex];
    socialSum += question.scoring.social[answerIndex];
  }

  // Normalization formula from politicalcompass.org
  const economicScore = Math.round(((economicSum / 8.0) + 0.38) * 100) / 100;
  const socialScore = Math.round(((socialSum / 19.5) + 2.41) * 100) / 100;

  return {
    economicScore: Math.max(-10, Math.min(10, economicScore)),
    socialScore: Math.max(-10, Math.min(10, socialScore)),
  };
}
