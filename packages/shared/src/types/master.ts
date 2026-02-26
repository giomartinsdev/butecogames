export type MasterMessageType = "TEXT" | "IMAGE";
export type MasterMessageRole = "USER" | "ASSISTANT";

export interface MasterConversation {
    _id: string;
    userId: string;
    title: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface MasterMessage {
    _id: string;
    conversationId: string;
    role: MasterMessageRole;
    content: string;
    type: MasterMessageType;
    aiModel: string;
    cost: number;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MasterModelInfo {
    id: string;
    name: string;
    provider: string;
    type: MasterMessageType;
    cost: number;
    enabled: boolean;
    tags?: string[];
}
