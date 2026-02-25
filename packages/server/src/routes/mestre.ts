import { Router } from "express";
import {
    listConversations,
    getConversation,
    processMestreInteraction,
    getMestreModels,
} from "../services/mestre.js";

import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/models", requireAuth, async (req, res, next) => {
    try {
        const models = getMestreModels();
        res.json(models);
    } catch (err) {
        next(err);
    }
});

router.get("/conversations", requireAuth, async (req, res, next) => {

    try {
        const conversations = await listConversations(req.user!.id);
        res.json(conversations);
    } catch (err) {
        next(err);
    }
});

router.get("/conversations/:id", requireAuth, async (req, res, next) => {
    try {
        const data = await getConversation(req.user!.id, req.params.id as string);
        if (!data) return res.status(404).json({ error: "Not found" });

        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.post("/chat", requireAuth, async (req, res, next) => {
    try {
        const { conversationId, content, modelId } = req.body;
        if (!content || !modelId)
            return res.status(400).json({ error: "Missing fields" });

        const result = await processMestreInteraction(
            req.user!.id,
            conversationId,
            content,
            modelId,
        );
        res.json(result);
    } catch (err: any) {
        if (err.message === "Você não possui coins suficientes") {
            return res.status(403).json({ error: err.message });
        }
        next(err);
    }
});

export default router;
