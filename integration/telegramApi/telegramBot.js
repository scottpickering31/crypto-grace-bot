import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_TOKEN;
const tgbot = new TelegramBot(token, { polling: true });

export { tgbot };
