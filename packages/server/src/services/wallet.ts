import { Wallet, type IWallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";
import { INITIAL_BALANCE, DAILY_REWARD_AMOUNT, DAILY_REWARD_COOLDOWN_MS } from "@butecogames/shared";
import type { TransactionType } from "@butecogames/shared";
import { invalidateLeaderboardCache } from "../routes/leaderboard.js";

export async function getOrCreateWallet(userId: string): Promise<IWallet> {
  const existing = await Wallet.findOne({ userId });
  if (existing) return existing;

  try {
    const created = await Wallet.create({ userId, balance: INITIAL_BALANCE });
    await Transaction.create({
      userId,
      type: "initial_balance" as TransactionType,
      amount: INITIAL_BALANCE,
      balanceAfter: INITIAL_BALANCE,
    });
    return created;
  } catch (err) {
    // Might have been created concurrently
    const fallback = await Wallet.findOne({ userId });
    if (fallback) return fallback;
    throw err;
  }
}

interface TransactionFields {
  gameId?: string;
  roundId?: string;
  eventId?: string;
  achievementId?: string;
  relatedUserId?: string;
}

export async function creditWallet(
  userId: string,
  amount: number,
  type: TransactionType,
  fields?: TransactionFields,
): Promise<IWallet> {
  amount = Math.ceil(amount);
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    {
      $inc: {
        balance: amount,
        ...(type === "bet_won" ? { totalWon: amount } : {}),
      },
    },
    { new: true },
  );

  if (!wallet) throw new Error(`Wallet not found for user ${userId}`);

  await Transaction.create({
    userId,
    type,
    amount,
    balanceAfter: wallet.balance,
    ...fields,
  });

  return wallet;
}

export async function debitWallet(
  userId: string,
  amount: number,
  type: TransactionType,
  fields?: TransactionFields,
): Promise<IWallet> {
  amount = Math.ceil(amount);
  const wallet = await Wallet.findOneAndUpdate(
    { userId, balance: { $gte: amount } },
    {
      $inc: {
        balance: -amount,
        ...(type === "bet_placed" ? { totalWagered: amount } : {}),
      },
    },
    { new: true },
  );

  if (!wallet) throw new Error("Você não possui coins suficientes");

  await Transaction.create({
    userId,
    type,
    amount: -amount,
    balanceAfter: wallet.balance,
    ...fields,
  });

  return wallet;
}

export async function transferCoins(
  senderId: string,
  recipientId: string,
  amount: number,
): Promise<IWallet> {
  if (senderId === recipientId) {
    throw new Error("Você não pode transferir para si mesmo");
  }

  if (amount <= 0) {
    throw new Error("Valor inválido");
  }

  amount = Math.ceil(amount);

  // Ensure recipient wallet exists before debiting sender
  await getOrCreateWallet(recipientId);

  // Debit sender
  const senderWallet = await debitWallet(senderId, amount, "transfer_sent", { relatedUserId: recipientId });

  // Credit recipient
  await creditWallet(recipientId, amount, "transfer_received", { relatedUserId: senderId });

  invalidateLeaderboardCache();

  return senderWallet;
}

export async function claimDailyReward(
  userId: string,
): Promise<{ wallet: IWallet; claimed: boolean }> {
  const { UserProfile } = await import("../models/UserProfile.js");
  const profile = await UserProfile.findOne({ userId });

  if (!profile) throw new Error("User profile not found");

  const now = new Date();
  if (
    profile.lastDailyReward &&
    now.getTime() - profile.lastDailyReward.getTime() < DAILY_REWARD_COOLDOWN_MS
  ) {
    const wallet = await getOrCreateWallet(userId);
    return { wallet, claimed: false };
  }

  profile.lastDailyReward = now;
  await profile.save();

  const wallet = await creditWallet(userId, DAILY_REWARD_AMOUNT, "daily_reward");
  return { wallet, claimed: true };
}
