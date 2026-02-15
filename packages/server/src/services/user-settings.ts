import { UserSettings, type IUserSettings } from "../models/UserSettings.js";
import { CURSOR_SETS } from "@butecogames/shared";

export async function getOrCreateUserSettings(
  userId: string,
): Promise<IUserSettings> {
  const existing = await UserSettings.findOne({ userId });
  if (existing) return existing;

  try {
    return await UserSettings.create({ userId });
  } catch (err) {
    const fallback = await UserSettings.findOne({ userId });
    if (fallback) return fallback;
    throw err;
  }
}

export async function updateUserSettings(
  userId: string,
  updates: { cursorSetId?: string },
): Promise<IUserSettings> {
  if (updates.cursorSetId) {
    const valid = CURSOR_SETS.some((cs) => cs.id === updates.cursorSetId);
    if (!valid) {
      throw new Error("Cursor inválido");
    }
  }

  const doc = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, runValidators: true, upsert: true },
  );

  if (!doc) throw new Error("Failed to update user settings");
  return doc;
}
