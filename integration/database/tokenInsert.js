const db = require("./db");
const { clearExistingInterval } = require("../intervalManager");
const { tokenPurchase } = require("../../services/tokenPurchase");

const tokenInsert = (token, triggerPurchase = false) => {
  const {
    baseToken: { address: token_address, name: token_name },
    liquidity: { usd: token_liquidity },
    priceUsd: current_price,
    boosts: { active: amount },
  } = token;

  const bought_price = current_price;
  const sell_price = bought_price * 2;

  const currentTime = Math.floor(new Date().getTime());
  const tokenTime = token.pairCreatedAt;
  const time_difference = Math.floor((currentTime - tokenTime) / (1000 * 60));
  console.log(time_difference);

  const date = new Date();
  date.setHours(date.getHours() + 1);
  const bought_at = date.toISOString().slice(0, 19).replace("T", " ");

  const query = `
    INSERT INTO tokens (token_address, token_liquidity, current_price, token_name, token_bought, bought_at, bought_price, sell_price, time_difference, amount) 
    VALUES (?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
      token_bought = IF(token_bought = FALSE, TRUE, token_bought),
      current_price = VALUES(current_price);`;

  db.query(
    query,
    [
      token_address,
      token_liquidity,
      current_price,
      token_name,
      bought_at,
      bought_price,
      sell_price,
      time_difference,
      amount,
    ],
    (err) => {
      if (err) {
        console.error("Error inserting/updating token:", err);
        return;
      }
      console.log("Token inserted or updated:", token);

      // Only trigger purchase if the flag is true
      if (triggerPurchase) {
        clearExistingInterval();
        tokenPurchase(token);
      }
    }
  );
};

module.exports = { tokenInsert };
