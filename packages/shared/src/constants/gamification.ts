import type {
  AchievementDefinition,
  ChallengeTemplate,
  LevelInfo,
  XpConfig,
} from "../types/gamification.js";

// ---- XP Configuration ----

export const XP_CONFIG: XpConfig = {
  betPlaced: 3,
  betWonBase: 10,
  betWonScaleFactor: 0.5,
  dailyReward: 15,
  challengeCompleted: 25,
  transferSent: 5,
  chatMessage: 1,
  politicalCompassCompleted: 50,
};

export const MAX_CHAT_XP_PER_DAY = 10;

/**
 * XP required to go from `level` to `level + 1`.
 * Formula: level * 75 + floor(level^1.5 * 10)
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return level * 75 + Math.floor(Math.pow(level, 1.5) * 10);
}

/**
 * Cumulative XP needed to reach a given level from level 1.
 */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += xpForLevel(l);
  }
  return total;
}

/**
 * Given total XP, compute the current level.
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (true) {
    const nextLevelXp = xpForLevel(level + 1);
    if (nextLevelXp === 0 || xpNeeded + nextLevelXp > totalXp) break;
    xpNeeded += nextLevelXp;
    level++;
  }
  return level;
}

/**
 * Given total XP, compute level info with progress toward next level.
 */
export function getLevelInfo(totalXp: number): LevelInfo {
  const level = levelFromXp(totalXp);
  const xpAtCurrentLevel = cumulativeXpForLevel(level);
  const xpForNextLevel = xpForLevel(level + 1);
  const currentXp = totalXp - xpAtCurrentLevel;
  const progress = xpForNextLevel > 0 ? currentXp / xpForNextLevel : 1;

  return {
    level,
    currentXp,
    xpForNextLevel,
    progress: Math.min(1, progress),
  };
}

/**
 * Calculate XP for winning a bet based on payout ratio.
 */
export function calculateWinXp(betAmount: number, payout: number): number {
  const ratio = payout / Math.max(betAmount, 1);
  const scaled = Math.floor(
    XP_CONFIG.betWonBase + ratio * XP_CONFIG.betWonScaleFactor * 10,
  );
  return Math.min(50, Math.max(XP_CONFIG.betWonBase, scaled));
}

// ---- Achievements (28 total) ----

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Betting milestones
  { id: "first_bet", name: "Primeira Aposta", description: "Faça sua primeira aposta", category: "betting", icon: "Coins", reward: 50 },
  { id: "bets_10", name: "Apostador", description: "Faça 10 apostas", category: "betting", icon: "TrendingUp", reward: 100 },
  { id: "bets_50", name: "Apostador Frequente", description: "Faça 50 apostas", category: "betting", icon: "TrendingUp", reward: 250 },
  { id: "bets_100", name: "Apostador Dedicado", description: "Faça 100 apostas", category: "betting", icon: "TrendingUp", reward: 500 },
  { id: "bets_500", name: "Viciado em Apostas", description: "Faça 500 apostas", category: "betting", icon: "Flame", reward: 1500 },
  { id: "bets_1000", name: "Lenda do Buteco", description: "Faça 1.000 apostas", category: "betting", icon: "Crown", reward: 5000 },

  // Winning milestones
  { id: "first_win", name: "Primeira Vitória", description: "Ganhe sua primeira aposta", category: "winning", icon: "Trophy", reward: 50 },
  { id: "wins_10", name: "Sortudo", description: "Ganhe 10 apostas", category: "winning", icon: "Star", reward: 200 },
  { id: "wins_50", name: "Mãos de Ouro", description: "Ganhe 50 apostas", category: "winning", icon: "Star", reward: 500 },
  { id: "wins_100", name: "Mestre das Apostas", description: "Ganhe 100 apostas", category: "winning", icon: "Star", reward: 1000 },
  { id: "wins_500", name: "Imbatível", description: "Ganhe 500 apostas", category: "winning", icon: "Swords", reward: 5000 },

  // Coins milestones
  { id: "wagered_1k", name: "Gastador", description: "Aposte um total de 1.000 coins", category: "milestone", icon: "Banknote", reward: 100 },
  { id: "wagered_10k", name: "Alto Apostador", description: "Aposte um total de 10.000 coins", category: "milestone", icon: "Banknote", reward: 500 },
  { id: "wagered_100k", name: "Baleia", description: "Aposte um total de 100.000 coins", category: "milestone", icon: "Banknote", reward: 2000 },
  { id: "won_1k", name: "Lucro Pequeno", description: "Ganhe um total de 1.000 coins", category: "milestone", icon: "PiggyBank", reward: 100 },
  { id: "won_10k", name: "Lucro Médio", description: "Ganhe um total de 10.000 coins", category: "milestone", icon: "PiggyBank", reward: 500 },
  { id: "won_100k", name: "Rei do Buteco", description: "Ganhe um total de 100.000 coins", category: "milestone", icon: "PiggyBank", reward: 2000 },

  // Game-specific
  { id: "roulette_number", name: "Número da Sorte", description: "Acerte um número exato na roleta", category: "betting", icon: "Target", reward: 500 },
  { id: "card_duel_5", name: "Duelista", description: "Vença 5 duelos de cartas", category: "winning", icon: "Sword", reward: 200 },
  { id: "card_duel_25", name: "Mestre do Duelo", description: "Vença 25 duelos de cartas", category: "winning", icon: "Sword", reward: 1000 },
  { id: "event_bet_first", name: "Palpiteiro", description: "Faça sua primeira aposta em evento", category: "betting", icon: "Calendar", reward: 50 },

  // Social
  { id: "political_compass_first", name: "Politizado", description: "Complete a Bússola Política pela primeira vez", category: "social", icon: "Compass", reward: 100 },
  { id: "first_transfer", name: "Generoso", description: "Envie sua primeira transferência", category: "social", icon: "HandCoins", reward: 50 },
  { id: "transfers_10", name: "Filantropo", description: "Envie 10 transferências", category: "social", icon: "HandCoins", reward: 300 },
  { id: "daily_7", name: "Frequentador", description: "Colete a recompensa diária 7 vezes", category: "social", icon: "CalendarCheck", reward: 200 },
  { id: "daily_30", name: "Habitué", description: "Colete a recompensa diária 30 vezes", category: "social", icon: "CalendarCheck", reward: 1000 },

  // Level milestones
  { id: "level_5", name: "Novato Avançado", description: "Alcance o nível 5", category: "milestone", icon: "ArrowUp", reward: 200 },
  { id: "level_10", name: "Veterano", description: "Alcance o nível 10", category: "milestone", icon: "ArrowUp", reward: 500 },
  { id: "level_25", name: "Elite do Buteco", description: "Alcance o nível 25", category: "milestone", icon: "Crown", reward: 2500 },

  // Challenge
  { id: "challenges_10", name: "Desafiante", description: "Complete 10 desafios", category: "challenge", icon: "CheckCircle", reward: 500 },
];

// ---- Challenge Templates (15 total) ----

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // Daily (10)
  { id: "daily_bet_3", type: "bet_count", period: "daily", name: "Apostador do Dia", description: "Faça 3 apostas hoje", target: 3, rewardCoins: 75, rewardXp: 20, icon: "Coins" },
  { id: "daily_bet_5", type: "bet_count", period: "daily", name: "Mão Quente", description: "Faça 5 apostas hoje", target: 5, rewardCoins: 125, rewardXp: 30, icon: "Coins" },
  { id: "daily_win_1", type: "win_count", period: "daily", name: "Vitória do Dia", description: "Ganhe 1 aposta hoje", target: 1, rewardCoins: 100, rewardXp: 25, icon: "Trophy" },
  { id: "daily_win_3", type: "win_count", period: "daily", name: "Sequência Vitoriosa", description: "Ganhe 3 apostas hoje", target: 3, rewardCoins: 200, rewardXp: 40, icon: "Trophy" },
  { id: "daily_roulette_3", type: "bet_count_roulette", period: "daily", name: "Girou, Ganhou?", description: "Faça 3 apostas na roleta hoje", target: 3, rewardCoins: 100, rewardXp: 20, icon: "CircleDot" },
  { id: "daily_card_duel_1", type: "bet_count_card_duel", period: "daily", name: "Duelo Diário", description: "Jogue 1 duelo de cartas hoje", target: 1, rewardCoins: 100, rewardXp: 20, icon: "Sword" },
  { id: "daily_claim", type: "daily_reward_claim", period: "daily", name: "Presença Garantida", description: "Colete a recompensa diária", target: 1, rewardCoins: 50, rewardXp: 15, icon: "Gift" },
  { id: "daily_transfer", type: "transfer_send", period: "daily", name: "Boa Ação do Dia", description: "Envie uma transferência hoje", target: 1, rewardCoins: 75, rewardXp: 15, icon: "HandCoins" },
  { id: "daily_spend_500", type: "spend_amount", period: "daily", name: "Gastão do Dia", description: "Aposte um total de 500 coins hoje", target: 500, rewardCoins: 150, rewardXp: 25, icon: "Banknote" },
  { id: "daily_chat_5", type: "chat_messages", period: "daily", name: "Tagarela", description: "Envie 5 mensagens no chat hoje", target: 5, rewardCoins: 50, rewardXp: 10, icon: "MessageCircle" },

  // Weekly (5)
  { id: "weekly_bet_20", type: "bet_count", period: "weekly", name: "Maratonista", description: "Faça 20 apostas esta semana", target: 20, rewardCoins: 500, rewardXp: 100, icon: "Flame" },
  { id: "weekly_win_10", type: "win_count", period: "weekly", name: "Campeão da Semana", description: "Ganhe 10 apostas esta semana", target: 10, rewardCoins: 750, rewardXp: 120, icon: "Medal" },
  { id: "weekly_all_games", type: "play_all_games", period: "weekly", name: "Explorador", description: "Aposte em todos os 3 jogos", target: 3, rewardCoins: 400, rewardXp: 80, icon: "Gamepad2" },
  { id: "weekly_spend_5k", type: "spend_amount", period: "weekly", name: "Investidor Semanal", description: "Aposte um total de 5.000 coins", target: 5000, rewardCoins: 1000, rewardXp: 150, icon: "Banknote" },
  { id: "weekly_win_2k", type: "win_amount", period: "weekly", name: "Grande Sortudo", description: "Ganhe um total de 2.000 coins", target: 2000, rewardCoins: 600, rewardXp: 100, icon: "Sparkles" },
];

export const DAILY_CHALLENGES_COUNT = 2;
export const WEEKLY_CHALLENGES_COUNT = 1;
