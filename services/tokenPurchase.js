const axios = require("axios");

const tokenPurchase = (token) => {
  console.log("Buying Token...");

  const date = new Date();
  date.setHours(date.getHours() + 1);
  const currentDateTime = date.toISOString().slice(0, 19).replace("T", " ");

  const botToken = process.env.TELEGRAM_TOKEN;
  const message = `Token Purchased! ${token.baseToken.name} for $${token.priceUsd} at ${currentDateTime}, token address is ${token.baseToken.address}.`;

  const sendTelegramMessage = async () => {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const response = await axios.post(url, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      });

      if (response.status === 200) {
        console.log("Telegram message sent successfully!");
      } else {
        console.error("Failed to send Telegram message:", response.statusText);
      }
    } catch (error) {
      console.error("Error sending Telegram message:", error.message);
    }
  };

  setTimeout(() => {
    console.log("Token Purchased!");
    sendTelegramMessage();
    // bot begin countdown here
  }, 500);
};

module.exports = { tokenPurchase };
