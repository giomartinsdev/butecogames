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
  updates: { cursorSetId?: string; soundEnabled?: boolean },
): Promise<IUserSettings> {
  if (updates.cursorSetId) {
    const valid = CURSOR_SETS.some((cs) => cs.id === updates.cursorSetId);
    if (!valid) {
      throw new Error("Cursor inválido");
    }
  }

  const setFields: Record<string, unknown> = {};
  if (updates.cursorSetId !== undefined) setFields.cursorSetId = updates.cursorSetId;
  if (updates.soundEnabled !== undefined) setFields.soundEnabled = updates.soundEnabled;

  const doc = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: setFields },
    { new: true, runValidators: true, upsert: true },
  );

  if (!doc) throw new Error("Failed to update user settings");
  return doc;
}
