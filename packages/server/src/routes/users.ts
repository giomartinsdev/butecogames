import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { UserProfile } from "../models/UserProfile.js";

const router = Router();

// Get current user profile
router.get("/me", requireAuth, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user!.id });

    if (!profile) {
      profile = await UserProfile.create({
        userId: req.user!.id,
        displayName: req.user!.name,
      });
    }

    res.json({
      user: req.user,
      profile,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get user profile by ID
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.params.userId });
    if (!profile) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ profile });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
