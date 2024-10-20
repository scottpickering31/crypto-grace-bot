const TelegramBot = require("node-telegram-bot-api");

// Load environment variables (make sure you have dotenv set up)
const token = process.env.TELEGRAM_TOKEN;
const tgbot = new TelegramBot(token, { polling: true });

module.exports = { tgbot };
