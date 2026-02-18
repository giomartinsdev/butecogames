import mongoose, { Schema, type Document } from "mongoose";

export interface IPoliticalCompassResult extends Document {
  userId: string;
  displayName: string;
  image: string | null;
  economicScore: number;
  socialScore: number;
  answers: Array<{ questionId: number; answer: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const politicalCompassResultSchema = new Schema<IPoliticalCompassResult>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    image: { type: String, default: null },
    economicScore: { type: Number, required: true },
    socialScore: { type: Number, required: true },
    answers: [
      {
        questionId: { type: Number, required: true },
        answer: { type: Number, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true },
);

export const PoliticalCompassResult =
  mongoose.model<IPoliticalCompassResult>(
    "PoliticalCompassResult",
    politicalCompassResultSchema,
  );
