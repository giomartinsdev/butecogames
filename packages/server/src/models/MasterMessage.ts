import mongoose, { Schema, type Document } from "mongoose";

export interface IMasterMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    role: "USER" | "ASSISTANT";
    content: string;
    type: "TEXT" | "IMAGE";
    aiModel: string;

    cost: number;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const masterMessageSchema = new Schema<IMasterMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "MasterConversation",
            required: true,
            index: true,
        },
        role: { type: String, enum: ["USER", "ASSISTANT"], required: true },
        content: { type: String, required: true },
        type: { type: String, enum: ["TEXT", "IMAGE"], default: "TEXT" },
        aiModel: { type: String, required: true },

        cost: { type: Number, default: 0 },
        imageUrl: { type: String },
    },
    { timestamps: true },
);

export const MasterMessage = mongoose.model<IMasterMessage>(
    "MasterMessage",
    masterMessageSchema,
);
