import { botBeginCountdown } from "../integration/botBeginCountdown.js";
import fetch from "node-fetch";

const tokenPurchase = (token) => {
  console.log("Buying Token...");

  const date = new Date();
  date.setHours(date.getHours() + 1);
  const currentDateTime = date.toISOString().slice(0, 19).replace("T", " ");

  const botToken = process.env.TELEGRAM_TOKEN;
  const message = `Token Purchased! ${token.baseToken.name} for $${token.priceUsd} at ${currentDateTime}, token address is ${token.baseToken.address}.`;

  const sendTelegramMessage = async () => {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
      }),
    });

    if (response.ok) {
      console.log("Telegram message sent successfully!");
    } else {
      console.error("Failed to send Telegram message:", response.statusText);
    }
  };

  setTimeout(() => {
    console.log("Token Purchased!");
    sendTelegramMessage();
    // setTimeout(() => {
    //   console.log("Searching for new tokens!" + botBeginCountdown());
    // });
  }, 500);
};

export { tokenPurchase };
