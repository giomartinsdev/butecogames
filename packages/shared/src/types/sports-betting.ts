export type BetOption = "team1" | "team2" | "draw";

export type EventStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

export type SportCategory =
  | "football"
  | "basketball"
  | "volleyball"
  | "esports"
  | "other";

export interface SportsBettingEvent {
  _id: string;
  title: string;
  description: string;
  category: SportCategory;
  team1: string;
  team2: string;
  startTime: Date;
  status: EventStatus;
  totalPool: number;
  team1Pool: number;
  team2Pool: number;
  drawPool: number;
  result: BetOption | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SportsBettingBet {
  _id: string;
  eventId: string;
  userId: string;
  option: BetOption;
  amount: number;
  potentialPayout: number; // Calculated at bet time (snapshot)
  actualPayout: number | null; // Filled after event resolves
  won: boolean | null;
  createdAt: Date;
}

export interface EventOdds {
  team1: number;
  team2: number;
  draw: number;
}
