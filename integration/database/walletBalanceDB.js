const db = require("./db");
const axios = require("axios");
const { telegramMessage } = require("../telegramApi/telegramMessage");

// Function to fetch the current USD price of SOL
async function fetchSolPrice() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
  try {
    const response = await axios.get(url);
    return response.data.solana.usd;
  } catch (error) {
    console.error("Error fetching SOL price:", error.message);
    throw new Error("Unable to fetch SOL price");
  }
}

// Function to store the wallet balance before a purchase
async function storeWalletBalanceDBPre(
  walletBalanceInLamports,
  token,
  transactionID
) {
  try {
    const walletBalanceInSol = walletBalanceInLamports / 1_000_000_000;
    const solPrice = await fetchSolPrice();
    const walletBalanceInUsd = walletBalanceInSol * solPrice;
    const tokenAddress = token.baseToken.address;

    const message = `Current Wallet balance before purchase is ${walletBalanceInSol.toFixed(
      2
    )} SOL or ${walletBalanceInUsd.toFixed(2)} USD`;
    telegramMessage(message);

    console.log("Updating wallet balance (pre-purchase)...");

    const query = `
      UPDATE wallet_balance
      SET transaction_id_buy = ?, balance_usd_pre = ?, balance_sol_pre = ?, balance_lamports_pre = ?
      WHERE token_address = ?;
    `;

    await db.query(query, [
      transactionID,
      walletBalanceInUsd.toFixed(2),
      walletBalanceInSol.toFixed(2),
      walletBalanceInLamports,
      tokenAddress,
    ]);

    console.log("Wallet balance updated successfully (pre-purchase).");
  } catch (error) {
    console.error(
      "Error updating wallet balance (pre-purchase):",
      error.message
    );
  }
}

// Function to store the wallet balance after a purchase
async function storeWalletBalanceDBPost(walletBalanceInLamports, token) {
  try {
    const walletBalanceInSol = walletBalanceInLamports / 1_000_000_000;
    const solPrice = await fetchSolPrice();
    const walletBalanceInUsd = walletBalanceInSol * solPrice;
    const tokenAddress = token.baseToken.address;

    console.log("Updating wallet balance (post-purchase)...");

    const query = `
      UPDATE wallet_balance
      SET balance_usd_post = ?, balance_sol_post = ?, balance_lamports_post = ?
      WHERE token_address = ?;
    `;

    const [result] = await db.query(query, [
      walletBalanceInUsd.toFixed(2),
      walletBalanceInSol.toFixed(2),
      walletBalanceInLamports,
      tokenAddress,
    ]);

    if (result.affectedRows === 0) {
      console.warn(
        `No matching token_address found for ${tokenAddress} in wallet_balance.`
      );
    } else {
      console.log("Wallet balance updated successfully (post-purchase). ");
    }
  } catch (error) {
    console.error(
      "Error updating wallet balance (post-purchase):",
      error.message
    );
  }
}

// Function to calculate and store PNL (Profit and Loss)
async function storeWalletBalanceDBPNL(token) {
  try {
    const tokenAddress = token.baseToken.address;

    console.log("Fetching pre and post balance for PNL calculation...");
    const query = `SELECT balance_usd_pre, balance_usd_post FROM wallet_balance WHERE token_address = ?`;
    const [rows] = await db.query(query, [tokenAddress]);

    if (rows.length === 0) {
      console.warn(
        `No data found for token_address: ${tokenAddress} in wallet_balance.`
      );
      return;
    }

    const { balance_usd_pre, balance_usd_post } = rows[0];
    const pnlUsd = balance_usd_post - balance_usd_pre;
    const pnlPercentage = ((pnlUsd / balance_usd_pre) * 100).toFixed(2);

    const message = `${token.baseToken.address} sold successfully, PNL: ${pnlUsd} USD (${pnlPercentage}%)`;
    telegramMessage(message);

    console.log("Updating PNL in the database...");
    const updateQuery = `
      UPDATE wallet_balance
      SET PNL_usd = ?, PNL_PERCENTAGE = ?
      WHERE token_address = ?;
    `;
    await db.query(updateQuery, [
      pnlUsd.toFixed(2),
      pnlPercentage,
      tokenAddress,
    ]);

    console.log("PNL updated successfully.");
  } catch (error) {
    console.error("Error calculating and storing PNL in DB:", error.message);
  }
}

module.exports = {
  storeWalletBalanceDBPre,
  storeWalletBalanceDBPost,
  storeWalletBalanceDBPNL,
};
