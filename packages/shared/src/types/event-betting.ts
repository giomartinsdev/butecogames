export type BetOption = "option1" | "option2" | "draw";

export type EventStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

export type EventCategory =
  | "sports"
  | "esports"
  | "politics"
  | "entertainment"
  | "other";

export interface EventBettingEvent {
  _id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  option1: string;
  option2: string;
  allowDraw: boolean;
  startTime: Date | null;
  status: EventStatus;
  totalPool: number;
  option1Pool: number;
  option2Pool: number;
  drawPool: number;
  result: BetOption | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventBettingBet {
  _id: string;
  eventId: string | EventBettingEvent; // Can be populated
  userId: string;
  option: BetOption;
  amount: number;
  potentialPayout: number; // Calculated at bet time (snapshot)
  actualPayout: number | null; // Filled after event resolves
  won: boolean | null;
  createdAt: Date;
}

export interface EventOdds {
  option1: number;
  option2: number;
  draw?: number;
}
