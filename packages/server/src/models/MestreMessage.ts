import mongoose, { Schema, type Document } from "mongoose";

export interface IMestreMessage extends Document {
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

const mestreMessageSchema = new Schema<IMestreMessage>(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "MestreConversation",
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

export const MestreMessage = mongoose.model<IMestreMessage>(
    "MestreMessage",
    mestreMessageSchema,
);
