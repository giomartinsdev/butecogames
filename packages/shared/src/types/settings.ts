import type { MasterModelInfo } from "./master.js";

export interface RouletteSettings {
  bettingDuration: number;
  spinningDuration: number;
  resultDuration: number;
  minBet: number;
  maxBet: number;
  maxBetsPerRound: number;
}

export interface EventBettingSettings {
  houseEdge: number;
  minBet: number;
  maxBet: number;
  maxBetsPerEvent: number;
}

export interface GeneralSettings {
  cursorSize: number;
  awayTimeout: number;
}

export interface CardDuelSettings {
  minBet: number;
  maxBet: number;
  revengeTimeout: number;
  disconnectGrace: number;
  cardRevealDelay: number;
  botBetAmount: number;
}

export interface PoliticalCompassSettings {
  retestCooldownDays: number;
}

export interface UnecoSettings {
  minPlayers: number;
  maxPlayers: number;
  turnTimeout: number;
  minBet: number;
  maxBet: number;
  unecoCatchWindow: number;
  disconnectGrace: number;
}

export interface MasterSettings {
  models: MasterModelInfo[];
}

export interface AppSettings {
  roulette: RouletteSettings;
  eventBetting: EventBettingSettings;
  cardDuel: CardDuelSettings;
  uneco: UnecoSettings;
  general: GeneralSettings;
  politicalCompass: PoliticalCompassSettings;
  master: MasterSettings;
}
