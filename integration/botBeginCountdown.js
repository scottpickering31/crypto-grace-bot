const { setIntervalId, clearExistingInterval } = require("./intervalManager");
const { startBot, flushBot } = require("../controllers/tokenController.js");
const { telegramMessage } = require("./telegramApi/telegramMessage.js");
const {
  setBotStartTime,
  setIsBotRunning,
} = require("../utils/sharedTimeState.js");

let isBotRunning = false;
let countdownTimeoutId = null;
let botStartTime = null;

const botBeginCountdown = (num) => {
  if (!isBotRunning) {
    const message = "Bot has been stopped during countdown.";
    console.log(message);
    return;
  }

  if (num > 0) {
    const message = `${num}...`;
    console.log(message);
    countdownTimeoutId = setTimeout(() => botBeginCountdown(num - 1), 1000);
  } else {
    const message = "Bot Started... THIS IS FIRST";
    console.log(message);
    const id = setInterval(() => {
      if (isBotRunning) {
        startBot();
      } else {
        console.log("startBot function execution stopped.");
        clearExistingInterval();
      }
    }, 3000);
    setIntervalId(id);
  }
};

const stopBotCountdown = () => {
  if (isBotRunning) {
    clearTimeout(countdownTimeoutId);
    clearExistingInterval();
    isBotRunning = false;
  } else {
    const message = "Bot is not currently running.";
    console.log(message);
  }
};

const flushBotCountdown = () => {
  stopBotCountdown();
  const message = "Bot flushing, this will take 30 seconds...";
  telegramMessage(message);

  let count = 0;
  const maxCount = 3;

  const id = setInterval(() => {
    if (count < maxCount) {
      console.log("flushBot:", flushBot);
      flushBot();
      count++;
      const message = `FlushBot executed ${count} times`;
      console.log(message);
    } else {
      clearExistingInterval();
      const message = "Bot finished flushing successfully.";
      console.log(message);
      telegramMessage(message);
    }
  }, 10000);

  setIntervalId(id);
};

const startCountdown = () => {
  isBotRunning = true;
  const botStartTime = new Date();
  setBotStartTime(botStartTime);
  setIsBotRunning(true);

  const formattedTime = botStartTime.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const message = `Bot started at ${formattedTime}.`;
  telegramMessage(message);
  botBeginCountdown(3);
};

const botRunning = () => {
  if (isBotRunning && botStartTime) {
    const currentTime = new Date();
    const elapsedTime = Math.floor((currentTime - botStartTime) / 1000 / 60);
    const message = `Bot has been running for ${elapsedTime} minutes.`;
    telegramMessage(message);
  } else {
    const message = "Bot is not currently running.";
    console.log(message);
    telegramMessage(message);
  }
};

module.exports = {
  startCountdown,
  stopBotCountdown,
  flushBotCountdown,
  botBeginCountdown,
  botRunning,
};
