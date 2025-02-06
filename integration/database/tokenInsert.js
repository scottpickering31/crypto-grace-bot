const db = require("./db");
const { submitBuySwap } = require("../../services/submitBuySwap");
const { telegramMessage } = require("../telegramApi/telegramMessage");

const tokenInsert = async (token, isFlush = true) => {
  const {
    baseToken: { address: token_address, name: token_name },
    liquidity: { usd: token_liquidity },
    priceUsd: current_price,
    boosts: { active: amount },
  } = token;

  const bought_price = current_price;
  const sell_price = bought_price * 1.4;

  const currentTime = Math.floor(new Date().getTime());
  const tokenTime = token.pairCreatedAt;
  const time_difference = Math.floor((currentTime - tokenTime) / (1000 * 60));

  const date = new Date();
  const bought_at = date.toISOString().slice(0, 19).replace("T", " ");

  const tokenQuery = `
    INSERT INTO tokens (token_address, token_liquidity, current_price, token_name, token_bought, bought_at, bought_price, sell_price, time_difference, amount) 
    VALUES (?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
      token_bought = IF(token_bought = FALSE, TRUE, token_bought),
      current_price = VALUES(current_price);`;

  const walletBalanceQuery = `
    INSERT INTO wallet_balance (token_address, token_name) 
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE 
      token_address = VALUES(token_address);`;

  try {
    // Execute token query
    await db.query(tokenQuery, [
      token_address,
      token_liquidity,
      current_price,
      token_name,
      bought_at,
      bought_price,
      sell_price,
      time_difference,
      amount,
    ]);

    console.log(`✅ Token ${token_name} inserted/updated successfully.`);

    // Only insert into wallet_balance if isFlush is false
    if (!isFlush) {
      await db.query(walletBalanceQuery, [token_address, token_name]);
      console.log(`✅ Wallet balance updated for ${token_name}.`);
    }

    // If isFlush is false, proceed with submitting the buy swap
    if (!isFlush) {
      console.log(
        `🚀 Trigger purchase activated on token ${token_name}, it has ${amount} boosts!`
      );
      submitBuySwap(token);
    }
  } catch (err) {
    console.error("❌ Error inserting/updating token:", err);
    telegramMessage(`Error inserting/updating token: ${err.message}`);
  }
};

module.exports = { tokenInsert };
