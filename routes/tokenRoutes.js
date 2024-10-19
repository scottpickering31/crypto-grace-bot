import express from "express";
import { sellToken } from "../controllers/tokenController.js";
import {
  startCountdown,
  flushBotCountdown,
  stopBotCountdown,
} from "../integration/botBeginCountdown.js";

const router = express.Router();

router.post("/start-bot", startCountdown);
router.post("/stop-bot", stopBotCountdown);
router.post("/sell-tokens", sellToken);
router.post("/flush-bot", flushBotCountdown);

export default router;
