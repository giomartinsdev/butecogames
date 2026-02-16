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
}

export interface AppSettings {
  roulette: RouletteSettings;
  eventBetting: EventBettingSettings;
  general: GeneralSettings;
}
