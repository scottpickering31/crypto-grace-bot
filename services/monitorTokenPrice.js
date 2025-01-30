const { submitSellSwap } = require("./submitSellSwap");
const {
  telegramMessage,
} = require("../integration/telegramApi/telegramMessage");
const axios = require("axios");

let monitorIntervalId = null;

const monitorTokenPrice = async (token) => {
  console.log(`${token.baseToken.name} MONITOR TOKEN PRICE ACTIVATED`);
  const url = `https://api.jup.ag/price/v2?ids=${token.baseToken.address}`;

  try {
    // Initial API call to fetch token pairs and find the correct pair
    const initialResponse = await axios.get(url);
    console.log(initialResponse + "Initial response from monitorTokenPrice: ");

    const usdPriceData =
      initialResponse.data.data[token.baseToken.address].price;

    const initialPrice = parseFloat(usdPriceData);
    const staticPriceFortyPercent = initialPrice * 1.25;
    const staticPriceMinusFiftyPercent = initialPrice * 0.8;

    monitorIntervalId = setInterval(async () => {
      try {
        const response = await axios.get(url);
        const currentPrice = parseFloat(
          response.data.data[token.baseToken.address].price
        );
        const message = `Monitoring token: ${token.baseToken.name}. Target price to get to is ${staticPriceFortyPercent}.\nPrice of failure is ${staticPriceMinusFiftyPercent}.\nCurrent price is ${currentPrice} SOL.`;
        telegramMessage(message);
      } catch (error) {
        console.error(
          "Error fetching token price for message update:",
          error.message
        );
      }
    }, 300000);

    console.log(
      `Monitoring ${token.baseToken.name}. Initial price: ${initialPrice} USD`
    );
    console.log(
      `Sell if price >= ${staticPriceFortyPercent} USD or <= ${staticPriceMinusFiftyPercent} USD`
    );

    const checkPrice = async () => {
      try {
        const response = await axios.get(url);

        const currentPrice = parseFloat(
          response.data.data[token.baseToken.address].price
        );

        console.log(
          `Current Price of ${token.baseToken.name}: ${currentPrice} USD, we are trying to get to ${staticPriceFortyPercent} USD at best or ${staticPriceMinusFiftyPercent} USD at worst`
        );

        if (
          currentPrice >= staticPriceFortyPercent ||
          currentPrice <= staticPriceMinusFiftyPercent
        ) {
          console.log("Target price reached, executing sell order...");

          if (monitorIntervalId !== null) {
            clearInterval(monitorIntervalId);
            monitorIntervalId = null;
            console.log("Monitoring interval cleared.");
          }

          try {
            telegramMessage(
              `Sell order initiated for ${token.baseToken.name}.`
            );
            await submitSellSwap(token);
            console.log("Sell order completed.");
          } catch (error) {
            console.error("Error during sell process:", error.message);
          }
        } else {
          console.log("Target price not reached yet...");
          setTimeout(checkPrice, 1100);
        }
      } catch (error) {
        console.error("Error fetching token price:", error.message);
      }
    };

    checkPrice();
  } catch (error) {
    console.error("Error fetching initial token price:", error.message);
  }
};

module.exports = { monitorTokenPrice };
