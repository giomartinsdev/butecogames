import { connectDatabase, getMongoDb } from "../db/connection.js";
import { UserProfile } from "../models/UserProfile.js";

async function makeAdmin(email: string) {
  try {
    console.log(`[Admin Script] Granting admin access to: ${email}`);

    // Connect to database
    await connectDatabase();
    const db = getMongoDb();

    // Find user by email in Better Auth user collection
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      console.error(`[Admin Script] User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`[Admin Script] Found user: ${user.name} (${user.id})`);

    // Update UserProfile to set role as admin
    const profile = await UserProfile.findOneAndUpdate(
      { userId: user.id },
      { $set: { role: "admin" } },
      { new: true, upsert: true }
    );

    if (profile) {
      console.log(`[Admin Script] ✅ Successfully granted admin access to ${user.name}`);
      console.log(`[Admin Script] Profile ID: ${profile._id}`);
      console.log(`[Admin Script] Role: ${profile.role}`);
    } else {
      console.error(`[Admin Script] Failed to update profile`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`[Admin Script] Error:`, error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error("Usage: pnpm run make-admin <email>");
  process.exit(1);
}

makeAdmin(email);
