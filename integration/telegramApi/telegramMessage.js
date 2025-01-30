const axios = require("axios");

const telegramMessage = async (message) => {
  const botToken = process.env.TELEGRAM_TOKEN;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const response = await axios.post(url, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
    });
    if (response.status === 200) {
      return;
    } else {
      console.error("Failed to send Telegram message:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending Telegram message:", error.message);
  }
};

module.exports = { telegramMessage };
