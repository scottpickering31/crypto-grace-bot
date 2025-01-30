const express = require("express");
const { sellToken } = require("../controllers/tokenController.js");
const {
  startCountdown,
  flushBotCountdown,
  stopBotCountdown,
  botRunning,
} = require("../integration/botBeginCountdown.js");

const router = express.Router();

router.post("/start-bot", startCountdown);
router.post("/stop-bot", stopBotCountdown);
router.post("/sell-tokens", sellToken);
router.post("/flush-bot", flushBotCountdown);
router.post("/bot-running", botRunning);

module.exports = router;
