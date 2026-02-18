import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { PoliticalCompassResult } from "../models/PoliticalCompassResult.js";
import {
  POLITICAL_COMPASS_QUESTIONS,
  calculatePoliticalCompass,
} from "@butecogames/shared";
import type { PoliticalCompassAnswer } from "@butecogames/shared";
import { processAction } from "../services/gamification.js";

const router = Router();

// GET /api/political-compass/questions
router.get("/questions", requireAuth, (_req, res) => {
  res.json({ questions: POLITICAL_COMPASS_QUESTIONS });
});

// GET /api/political-compass/result — current user's result
router.get("/result", requireAuth, async (req, res) => {
  try {
    const result = await PoliticalCompassResult.findOne({
      userId: req.user!.id,
    });
    res.json({ result: result ? result.toObject() : null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/political-compass/submit
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const { answers } = req.body as { answers: PoliticalCompassAnswer[] };

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Respostas inválidas" });
    }

    const validAnswerValues = [0, 1, 2, 3];
    const questionIds = new Set(
      POLITICAL_COMPASS_QUESTIONS.map((q) => q.id),
    );

    for (const answer of answers) {
      if (!questionIds.has(answer.questionId)) {
        return res
          .status(400)
          .json({ error: `Pergunta inválida: ${answer.questionId}` });
      }
      if (!validAnswerValues.includes(answer.answer)) {
        return res
          .status(400)
          .json({ error: `Resposta inválida para ${answer.questionId}` });
      }
    }

    if (answers.length !== POLITICAL_COMPASS_QUESTIONS.length) {
      return res.status(400).json({
        error: `Todas as ${POLITICAL_COMPASS_QUESTIONS.length} perguntas devem ser respondidas`,
      });
    }

    // 6-month cooldown check
    const existing = await PoliticalCompassResult.findOne({
      userId: req.user!.id,
    });
    if (existing) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (existing.updatedAt > sixMonthsAgo) {
        const nextDate = new Date(existing.updatedAt);
        nextDate.setMonth(nextDate.getMonth() + 6);
        return res.status(429).json({
          error: `Você só pode refazer o teste após 6 meses. Próxima data: ${nextDate.toLocaleDateString("pt-BR")}`,
        });
      }
    }

    const { economicScore, socialScore } = calculatePoliticalCompass(
      answers,
      POLITICAL_COMPASS_QUESTIONS,
    );

    const result = await PoliticalCompassResult.findOneAndUpdate(
      { userId: req.user!.id },
      {
        userId: req.user!.id,
        displayName: req.user!.name,
        image: req.user!.image ?? null,
        economicScore,
        socialScore,
        answers,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Award XP (+ achievement on first completion) — non-blocking
    processAction(req.user!.id, "political_compass_completed");

    res.json({ result: result.toObject() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/political-compass/results — all users' results (scores only, no answers)
router.get("/results", requireAuth, async (_req, res) => {
  try {
    const results = await PoliticalCompassResult.find(
      {},
      {
        userId: 1,
        displayName: 1,
        image: 1,
        economicScore: 1,
        socialScore: 1,
        updatedAt: 1,
      },
    ).sort({ updatedAt: -1 });

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/political-compass/results/:userId — a specific user's full result with answers
router.get("/results/:userId", requireAuth, async (req, res) => {
  try {
    const result = await PoliticalCompassResult.findOne({
      userId: req.params.userId,
    });
    if (!result) {
      return res.status(404).json({ error: "Resultado não encontrado" });
    }
    res.json({ result: result.toObject() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
