import { apiFetch } from "./client.js";
import type { MestreConversation, MestreMessage, MestreModelInfo } from "@butecogames/shared";

export const mestreApi = {
    getModels: () => apiFetch<MestreModelInfo[]>("/api/mestre/models"),
    listConversations: () => apiFetch<MestreConversation[]>("/api/mestre/conversations"),
    getConversation: (id: string) =>
        apiFetch<{ conversation: MestreConversation; messages: MestreMessage[] }>(
            `/api/mestre/conversations/${id}`,
        ),
    chat: (payload: {
        conversationId: string | null;
        content: string;
        modelId: string;
    }) =>
        apiFetch<{
            conversation: MestreConversation;
            userMessage: MestreMessage;
            assistantMessage: MestreMessage;
            balance: number;
        }>("/api/mestre/chat", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
};
