import { apiFetch } from "./client.js";
import type { MasterConversation, MasterMessage, MasterModelInfo } from "@butecogames/shared";

export const masterApi = {
    getModels: () => apiFetch<MasterModelInfo[]>("/api/master/models"),
    listConversations: () => apiFetch<MasterConversation[]>("/api/master/conversations"),
    getConversation: (id: string) =>
        apiFetch<{ conversation: MasterConversation; messages: MasterMessage[] }>(
            `/api/master/conversations/${id}`,
        ),
    chat: (payload: {
        conversationId: string | null;
        content: string;
        modelId: string;
    }) =>
        apiFetch<{
            conversation: MasterConversation;
            userMessage: MasterMessage;
            assistantMessage: MasterMessage;
            balance: number;
        }>("/api/master/chat", {
            method: "POST",
            body: JSON.stringify(payload),
        }),
};
