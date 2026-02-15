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
    team1: { type: String, required: true },
    team2: { type: String, required: true },
    allowDraw: { type: Boolean, default: true },
    startTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["upcoming", "in_progress", "completed", "cancelled"],
      default: "upcoming",
      index: true,
    },
    totalPool: { type: Number, default: 0 },
    team1Pool: { type: Number, default: 0 },
    team2Pool: { type: Number, default: 0 },
    drawPool: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ["team1", "team2", "draw", null],
      default: null,
    },
  },
  { timestamps: true }
);

export const EventBettingEvent = model(
  "EventBettingEvent",
  eventBettingEventSchema
);
