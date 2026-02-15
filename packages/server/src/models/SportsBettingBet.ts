import { Schema, model } from "mongoose";

const sportsBettingBetSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "SportsBettingEvent",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    option: {
      type: String,
      enum: ["team1", "team2", "draw"],
      required: true,
    },
    amount: { type: Number, required: true },
    potentialPayout: { type: Number, required: true },
    actualPayout: { type: Number, default: null },
    won: { type: Boolean, default: null },
  },
  { timestamps: true }
);

export const SportsBettingBet = model(
  "SportsBettingBet",
  sportsBettingBetSchema
);
