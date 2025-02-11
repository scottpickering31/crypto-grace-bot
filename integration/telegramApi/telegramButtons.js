const { tgbot } = require("./telegramBot");
const axios = require("axios");

// Define the inline keyboard for the buttons
const keyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "Start Bot", callback_data: "start-bot" },
        { text: "Stop Bot", callback_data: "stop-bot" },
        { text: "Bot Still Running?", callback_data: "bot-running" },
      ],
      [
        { text: "Flush Bot", callback_data: "flush-bot" },
        { text: "Sell Tokens", callback_data: "sell-tokens" },
      ],
    ],
    one_time_keyboard: true,
    persistent: true,
  },
};

// Listen for messages (optional, e.g., when someone types /start)
tgbot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log("Received /start command from chat ID:", chatId); // Debugging line
  tgbot.sendMessage(chatId, "Choose an action:", keyboard);
});

// Listen for button clicks (callback queries)
tgbot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const action = callbackQuery.data;

  let apiUrl;

  // Map the callback actions to API URLs
  switch (action) {
    case "start-bot":
      apiUrl = "http://localhost:3000/api/start-bot";
      break;
    case "stop-bot":
      apiUrl = "http://localhost:3000/api/stop-bot";
      break;
    case "flush-bot":
      apiUrl = "http://localhost:3000/api/flush-bot";
      break;
    case "sell-tokens":
      apiUrl = "http://localhost:3000/api/sell-tokens";
      break;
    case "bot-running":
      apiUrl = "http://localhost:3000/api/bot-running";
      break;

    default:
      return;
  }

  try {
    // Send a POST request to the API
    const response = await axios.post(apiUrl);

    // Send a message back to the user and keep the keyboard visible
    tgbot.sendMessage(
      chatId,
      `Action '${action}' executed successfully.`,
      keyboard
    );
  } catch (error) {
    tgbot.sendMessage(
      chatId,
      `Failed to execute action '${action}': ${error.message}`,
      keyboard
    );
  }
});
