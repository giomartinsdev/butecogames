export interface RouletteSettings {
  bettingDuration: number;
  spinningDuration: number;
  resultDuration: number;
}

export interface AppSettings {
  roulette: RouletteSettings;
}
