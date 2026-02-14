import mongoose from "mongoose";
import { Wallet, type IWallet } from "../models/Wallet.js";
import { Transaction } from "../models/Transaction.js";
import { INITIAL_BALANCE, DAILY_REWARD_AMOUNT, DAILY_REWARD_COOLDOWN_MS } from "@butecogames/shared";
import type { TransactionType } from "@butecogames/shared";

export async function getOrCreateWallet(userId: string): Promise<IWallet> {
  const existing = await Wallet.findOne({ userId });
  if (existing) return existing;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const [created] = await Wallet.create([{ userId, balance: INITIAL_BALANCE }], { session });
    await Transaction.create(
      [
        {
          userId,
          type: "initial_balance" as TransactionType,
          amount: INITIAL_BALANCE,
          balanceAfter: INITIAL_BALANCE,
        },
      ],
      { session },
    );
    await session.commitTransaction();
    return created;
  } catch (err) {
    await session.abortTransaction();
    // Might have been created concurrently
    const fallback = await Wallet.findOne({ userId });
    if (fallback) return fallback;
    throw err;
  } finally {
    session.endSession();
  }
}

export async function creditWallet(
  userId: string,
  amount: number,
  type: TransactionType,
  metadata?: { gameId?: string; roundId?: string; achievementId?: string },
): Promise<IWallet> {
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
    metadata,
  });

  return wallet;
}

export async function debitWallet(
  userId: string,
  amount: number,
  type: TransactionType,
  metadata?: { gameId?: string; roundId?: string; achievementId?: string },
): Promise<IWallet> {
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

  if (!wallet) throw new Error("Insufficient balance");

  await Transaction.create({
    userId,
    type,
    amount: -amount,
    balanceAfter: wallet.balance,
    metadata,
  });

  return wallet;
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
