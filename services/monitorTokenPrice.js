const { submitSellSwap } = require("./submitSellSwap");
const {
  telegramMessage,
} = require("../integration/telegramApi/telegramMessage");
const axios = require("axios");

let monitorIntervalId = null;
let priceHistory = []; // Stores the last 20 prices (over 40 minutes)

const monitorTokenPrice = async (token) => {
  console.log(`${token.baseToken.name} MONITOR TOKEN PRICE ACTIVATED`);
  const url = `https://api.jup.ag/price/v2?ids=${token.baseToken.address}`;

  try {
    // Initial API call to fetch the token price
    const initialResponse = await axios.get(url);
    console.log(
      "Initial response from monitorTokenPrice:",
      initialResponse.data
    );

    const usdPriceData =
      initialResponse.data.data[token.baseToken.address].price;
    const initialPrice = parseFloat(usdPriceData);
    const targetPrice = initialPrice * 1.25;
    const failurePrice = initialPrice * 0.8;

    console.log(
      `Monitoring ${token.baseToken.name}. Initial price: ${initialPrice} USD`
    );
    console.log(
      `Sell if price >= ${targetPrice} USD or <= ${failurePrice} USD`
    );

    // Function to fetch current price and check conditions
    const checkPrice = async () => {
      try {
        const response = await axios.get(url);
        const currentPrice = parseFloat(
          response.data.data[token.baseToken.address].price
        );
        priceHistory.push(currentPrice);

        // Keep only the last 20 price entries (40-minute window)
        if (priceHistory.length > 20) {
          priceHistory.shift();
        }

        console.log(
          `Current Price of ${token.baseToken.name}: ${currentPrice} USD`
        );

        // Calculate mean price change over the last 40 minutes
        if (priceHistory.length === 20) {
          const meanPrice =
            priceHistory.reduce((sum, price) => sum + price, 0) /
            priceHistory.length;
          const meanChange = (meanPrice - initialPrice) / initialPrice;

          console.log(`Mean Price over 40 mins: ${meanPrice} USD`);
          console.log(`Mean Change: ${(meanChange * 100).toFixed(2)}%`);

          if (Math.abs(meanChange) <= 0.15) {
            console.log("Price stagnated for 40 mins. Initiating sell...");
            telegramMessage(
              `Stagnant price detected for ${token.baseToken.name}. Initiating sell.`
            );
            await submitSellSwap(token);
            return;
          }
        }

        if (currentPrice >= targetPrice || currentPrice <= failurePrice) {
          console.log("Target price reached, executing sell order...");
          if (monitorIntervalId !== null) {
            clearInterval(monitorIntervalId);
            monitorIntervalId = null;
            console.log("Monitoring interval cleared.");
          }
          telegramMessage(`Sell order initiated for ${token.baseToken.name}.`);
          await submitSellSwap(token);
        } else {
          console.log("Target price not reached yet...");
          setTimeout(checkPrice, 1100);
        }
      } catch (error) {
        console.error("Error fetching token price:", error.message);
      }
    };

    // Store price every 2 minutes
    monitorIntervalId = setInterval(async () => {
      try {
        const response = await axios.get(url);
        const currentPrice = parseFloat(
          response.data.data[token.baseToken.address].price
        );
        priceHistory.push(currentPrice);

        if (priceHistory.length > 20) {
          priceHistory.shift();
        }

        const message = `Monitoring ${token.baseToken.name}. Target: ${targetPrice}, Fail: ${failurePrice}, Current: ${currentPrice}.`;
        telegramMessage(message);
      } catch (error) {
        console.error("Error fetching token price for update:", error.message);
      }
    }, 120000); // Every 2 minutes

    checkPrice();
  } catch (error) {
    console.error("Error fetching initial token price:", error.message);
  }
};

module.exports = { monitorTokenPrice };
