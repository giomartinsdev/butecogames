import { Schema, model } from "mongoose";

const eventBettingBetSchema = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "EventBettingEvent",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    option: {
      type: String,
      enum: ["option1", "option2", "draw"],
      required: true,
    },
    amount: { type: Number, required: true },
    potentialPayout: { type: Number, required: true },
    actualPayout: { type: Number, default: null },
    won: { type: Boolean, default: null },
  },
  { timestamps: true }
);

export const EventBettingBet = model(
  "EventBettingBet",
  eventBettingBetSchema
);
