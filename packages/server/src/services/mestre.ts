import fetch from "node-fetch";
import { env } from "../config/env.js";
import { MestreConversation } from "../models/MestreConversation.js";
import { MestreMessage } from "../models/MestreMessage.js";
import { debitWallet } from "./wallet.js";
import { MESTRE_SYSTEM_PROMPT, MESTRE_MODELS } from "@butecogames/shared";
import { getIO } from "../socket/io-store.js";

const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

export function getMestreModels() {
    return MESTRE_MODELS;
}

export async function listConversations(userId: string) {
    return MestreConversation.find({ userId }).sort({ lastMessageAt: -1 });
}

export async function getConversation(userId: string, conversationId: string) {
    const conversation = await MestreConversation.findOne({ _id: conversationId, userId });
    if (!conversation) return null;
    const messages = await MestreMessage.find({ conversationId }).sort({ createdAt: 1 });
    return { conversation, messages };
}

/**
 * Generic fetcher for NVIDIA APIs
 */
async function callNvidia(url: string, payload: any): Promise<any> {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${env.NVIDIA_NIM_API_KEY}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`NVIDIA API Error (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Refines the prompt for image generation using an LLM
 */
async function refineImagePrompt(prompt: string): Promise<string> {
    const modelId = "meta/llama-3.3-70b-instruct";
    const payload = {
        model: modelId,
        messages: [{
            role: "user",
            content: `PERSONA: ${MESTRE_SYSTEM_PROMPT}\n\nTAREFAS: Refine o prompt de imagem do usuário abaixo para algo mais artístico e detalhado. Responda APENAS com o prompt refinado em inglês.\n\nPROMPT DO USUÁRIO: ${prompt}`
        }]
    };

    try {
        const data: any = await callNvidia(NVIDIA_CHAT_URL, payload);
        return data.choices?.[0]?.message?.content?.trim() || prompt;
    } catch (err) {
        console.warn("[MestreService] Prompt refinement failed, using original:", err);
        return prompt;
    }
}

/**
 * Generates an image using NVIDIA NIM
 */
async function generateImage(modelId: string, prompt: string): Promise<string> {
    const refinedPrompt = await refineImagePrompt(prompt);

    // Normalize URL mapping for NIM
    const formattedModelId = modelId.replace(/-1-/g, ".1-").replace(/_1-/g, ".1-");
    const invokeUrl = `https://ai.api.nvidia.com/v1/genai/${formattedModelId}`;

    const payload: any = { prompt: refinedPrompt };

    // Model specific parameters
    if (modelId.includes("stabilityai")) {
        payload.mode = "text-to-image";
    } else if (modelId.includes("flux")) {
        payload.steps = modelId.includes("schnell") ? 4 : 50;
    } else {
        payload.cfg_scale = 3.5;
        payload.steps = 50;
    }

    const data: any = await callNvidia(invokeUrl, payload);
    const b64 = data.image || data.artifacts?.[0]?.base64;

    if (!b64) throw new Error("No image data in response");

    return `data:image/jpeg;base64,${b64}`;
}

/**
 * Generates text response using NVIDIA NIM
 */
async function generateText(modelId: string, history: any[]): Promise<string> {
    const messages = history.map((m, idx) => ({
        role: m.role.toLowerCase(),
        content: idx === 0 ? `PERSONA DO MESTRE: ${MESTRE_SYSTEM_PROMPT}\n\nMENSAGEM: ${m.content}` : m.content
    }));

    // Consolidate consecutive messages from the same role
    const consolidated: any[] = [];
    messages.forEach(msg => {
        if (consolidated.length > 0 && consolidated[consolidated.length - 1].role === msg.role) {
            consolidated[consolidated.length - 1].content += "\n" + msg.content;
        } else {
            consolidated.push(msg);
        }
    });

    const data: any = await callNvidia(NVIDIA_CHAT_URL, { model: modelId, messages: consolidated });
    return data.choices?.[0]?.message?.content || "Não tenho nada a dizer.";
}

export async function processMestreInteraction(
    userId: string,
    conversationId: string | null,
    content: string,
    modelId: string,
) {
    const models = getMestreModels();
    const model = models.find((m: any) => m.id === modelId);
    if (!model) throw new Error("Modelo não encontrado");

    // 1. Get or Create Conversation
    const conversation = conversationId
        ? await MestreConversation.findOne({ _id: conversationId, userId })
        : await MestreConversation.create({ userId, title: content.substring(0, 30) + (content.length > 30 ? "..." : "") });

    if (!conversation) throw new Error("Conversa não encontrada");

    // 2. Save User Message
    const userMessage = await MestreMessage.create({
        conversationId: conversation._id,
        role: "USER",
        content,
        type: "TEXT",
        aiModel: modelId,
        cost: 0,
    });

    // 3. Process with AI
    let assistantContent = "";
    let imageUrl = "";

    if (model.type === "IMAGE") {
        imageUrl = await generateImage(model.id, content);
        assistantContent = "Está aqui sua imagem. Tente não estragar ela.";
    } else {
        const history = await MestreMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(20);
        assistantContent = await generateText(model.id, history);
    }

    // 4. Handle Wallet and Message persistence
    const wallet = await debitWallet(userId, model.cost, "mestre_ai", { gameId: "mestre" });
    const assistantMessage = await MestreMessage.create({
        conversationId: conversation._id,
        role: "ASSISTANT",
        content: assistantContent,
        type: model.type,
        aiModel: modelId,
        cost: model.cost,
        imageUrl: model.type === "IMAGE" ? imageUrl : undefined,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    // 5. Notify UI
    getIO().to(`user:${userId}`).emit("wallet:updated", { balance: wallet.balance, userId });

    return { conversation, userMessage, assistantMessage, balance: wallet.balance };
}

