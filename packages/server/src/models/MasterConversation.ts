import mongoose, { Schema, type Document } from "mongoose";

export interface IMasterConversation extends Document {
    userId: string;
    title: string;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const masterConversationSchema = new Schema<IMasterConversation>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, default: "Nova Conversa" },
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const MasterConversation = mongoose.model<IMasterConversation>(
    "MasterConversation",
    masterConversationSchema
);
