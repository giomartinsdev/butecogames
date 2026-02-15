import { Schema, model } from "mongoose";

const eventBettingEventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["sports", "esports", "politics", "entertainment", "other"],
      required: true,
    },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    allowDraw: { type: Boolean, default: true },
    startTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["upcoming", "in_progress", "completed", "cancelled"],
      default: "upcoming",
      index: true,
    },
    totalPool: { type: Number, default: 0 },
    option1Pool: { type: Number, default: 0 },
    option2Pool: { type: Number, default: 0 },
    drawPool: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["option1", "option2", "draw", null],
      default: null,
    },
  },
  { timestamps: true }
);

export const EventBettingEvent = model(
  "EventBettingEvent",
  eventBettingEventSchema
);
