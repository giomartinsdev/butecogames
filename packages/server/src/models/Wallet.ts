import mongoose, { Schema, type Document } from "mongoose";

export interface IWallet extends Document {
  userId: string;
  balance: number;
  totalWagered: number;
  totalWon: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 1000, min: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
