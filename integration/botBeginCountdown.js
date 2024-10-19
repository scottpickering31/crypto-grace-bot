import { setIntervalId, clearExistingInterval } from "./intervalManager.js";
import { startBot, flushBot } from "../controllers/tokenController.js";
import { tgbot } from "../integration/telegramApi/telegramBot.js";

let isBotRunning = false;
let countdownTimeoutId = null;

const chatId = process.env.TELEGRAM_CHAT_ID;

const botBeginCountdown = (num) => {
  if (!isBotRunning) {
    const message = "Bot has been stopped during countdown.";
    console.log(message);
    return;
  }

  if (num > 0) {
    const message = `${num}...`;
    console.log(message);
    tgbot.sendMessage(chatId, message);
    countdownTimeoutId = setTimeout(() => botBeginCountdown(num - 1), 1000);
  } else {
    const message = "Bot Started...";
    console.log(message);
    tgbot.sendMessage(chatId, message);
    const id = setInterval(() => {
      if (isBotRunning) {
        startBot();
      } else {
        console.log("startBot function execution stopped.");
        clearExistingInterval();
      }
    }, 1000);
    setIntervalId(id);
  }
};

const stopBotCountdown = () => {
  if (isBotRunning) {
    clearTimeout(countdownTimeoutId);
    clearExistingInterval();
    isBotRunning = false;
    const message = "Bot stopped successfully during countdown or execution.";
    console.log(message);
    tgbot.sendMessage(chatId, message);
  } else {
    const message = "Bot is not currently running.";
    console.log(message);
    tgbot.sendMessage(chatId, message);
  }
};

const flushBotCountdown = () => {
  stopBotCountdown();

  let count = 0;
  const maxCount = 6;

  const id = setInterval(() => {
    if (count < maxCount) {
      flushBot();
      count++;
      const message = `FlushBot executed ${count} times`;
      console.log(message);
      tgbot.sendMessage(chatId, message);
    } else {
      clearExistingInterval();
      const message = "FlushBot has completed 6 executions. Stopping...";
      console.log(message);
      tgbot.sendMessage(chatId, message);
    }
  }, 5000);

  setIntervalId(id);
};

const startCountdown = () => {
  isBotRunning = true;
  botBeginCountdown(3);
};

export {
  startCountdown,
  stopBotCountdown,
  flushBotCountdown,
  botBeginCountdown,
};
