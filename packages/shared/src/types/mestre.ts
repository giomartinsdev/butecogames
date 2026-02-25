export type MestreMessageType = "TEXT" | "IMAGE";
export type MestreMessageRole = "USER" | "ASSISTANT";

export interface MestreConversation {
    _id: string;
    userId: string;
    title: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface MestreMessage {
    _id: string;
    conversationId: string;
    role: MestreMessageRole;
    content: string;
    type: MestreMessageType;
    aiModel: string;
    cost: number;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MestreModelInfo {
    id: string;
    name: string;
    provider: string;
    type: MestreMessageType;
    cost: number;
    tags?: string[];
}
