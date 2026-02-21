import { Schema, model } from "mongoose";

const eventBettingEventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    category: {
      type: String,
      enum: ["ufc", "sports", "esports", "entertainment", "other"],
      required: true,
    },
    option1: { type: String, required: true },
    option2: { type: String, required: true },
    option1Image: { type: String, default: null },
    option2Image: { type: String, default: null },
    option1ImageUrl: { type: String, default: null },
    option2ImageUrl: { type: String, default: null },
    allowDraw: { type: Boolean, default: true },
    startTime: { type: Date, default: null },
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
