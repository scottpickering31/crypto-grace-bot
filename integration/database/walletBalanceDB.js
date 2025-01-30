const db = require("./db");
const axios = require("axios");
const { telegramMessage } = require("../telegramApi/telegramMessage");

// Function to fetch the current USD price of SOL
async function fetchSolPrice() {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
  try {
    const response = await axios.get(url);
    const solPrice = response.data.solana.usd;
    return solPrice;
  } catch (error) {
    console.error("Error fetching SOL price:", error.message);
    throw new Error("Unable to fetch SOL price");
  }
}

// Function to store the wallet balance
async function storeWalletBalanceDBPre(
  walletBalanceInLamports,
  token,
  transactionID
) {
  try {
    const walletBalanceInSol = walletBalanceInLamports / 1_000_000_000; // Convert lamports to SOL
    const balanceInLamports = walletBalanceInLamports;

    // Fetch the current SOL price
    const solPrice = await fetchSolPrice();

    // Calculate the wallet balance in USD
    const walletBalanceInUsd = walletBalanceInSol * solPrice;

    const tokenAddress = token.baseToken.address; // Assuming this is the token address from the `token` object

    const message = `Current Wallet balance before purchase is ${walletBalanceInSol.toFixed(
      2
    )} SOL or ${walletBalanceInUsd.toFixed(2)} USD`;
    telegramMessage(message);
    console.log(`Wallet Balance: ${walletBalanceInSol.toFixed(2)} SOL`);
    console.log(`Wallet Balance in USD: $${walletBalanceInUsd.toFixed(2)}`);
    console.log(`Token Address: ${tokenAddress}`);
    console.log(`Transaction ID: ${transactionID}`);

    // Upsert the balance in the database for the given token_address
    const query = `
  UPDATE wallet_balance
      SET
      transaction_id_buy = ?,
        balance_usd_pre = ?,
        balance_sol_pre = ?,
        balance_lamports_pre = ?
      WHERE token_address = ?;
    `;

    // Await the query execution
    db.query(query, [
      transactionID,
      walletBalanceInUsd.toFixed(2),
      walletBalanceInSol.toFixed(2),
      balanceInLamports,
      tokenAddress,
    ]);

    console.log("Wallet balance inserted/updated successfully:");
  } catch (error) {
    console.error("Error updating wallet balance:", error.message);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
  }
}

async function storeWalletBalanceDBPost(walletBalanceInLamports, token) {
  try {
    const walletBalanceInSol = walletBalanceInLamports / 1000000000;

    // Fetch the current SOL price
    const solPrice = await fetchSolPrice();

    // Calculate the wallet balance in USD
    const walletBalanceInUsd = walletBalanceInSol * solPrice;

    const tokenAddress = token.baseToken.address; // Assuming this is the token address from the `token` object

    // Update the balance in your database for the existing token_address
    const query = `
      UPDATE wallet_balance
      SET 
        balance_usd_post = ?,
        balance_sol_post = ?,
        balance_lamports_post = ?
      WHERE token_address = ?;
    `;

    // Execute the query
    const [result] = db.query(query, [
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
      console.log("Wallet balance updated in the database successfully.");
    }
  } catch (error) {
    console.error("Error storing wallet balance:", error.message);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
  }
}

async function storeWalletBalanceDBPNL(token) {
  try {
    const tokenAddress = token.baseToken.address; // Assuming this is the token address from the `token` object

    // Fetch the balance_usd_pre and balance_usd_post from the wallet_balance table
    const query = `SELECT balance_usd_pre, balance_usd_post FROM wallet_balance WHERE token_address = ?`;

    // Execute the query
    const [rows] = db.execute(query, [tokenAddress]);

    if (rows.length === 0) {
      console.warn(
        `No data found for token_address: ${tokenAddress} in wallet_balance.`
      );
      return;
    }

    // Calculate the PNL (Profit and Loss)
    const { balance_usd_pre, balance_usd_post } = rows[0];
    const pnlUsd = balance_usd_post - balance_usd_pre; // PNL in USD

    // Calculate the PNL percentage
    const pnlPercentage = ((pnlUsd / balance_usd_pre) * 100).toFixed(2); // PNL Percentage

    const message = `${token.baseToken.address} sold successfully, PNL from this transaction is ${pnlUsd} and PNL percentage of initial input amount is ${pnlPercentage}`;
    telegramMessage(message);

    // Update the PNL values in the database for the corresponding token_address
    const updateQuery = `
      UPDATE wallet_balance
      SET PNL_usd = ?, PNL_PERCENTAGE = ?
      WHERE token_address = ?;
    `;

    // Execute the update query
    const [result] = db.query(updateQuery, [
      pnlUsd.toFixed(2),
      pnlPercentage,
      tokenAddress,
    ]);

    if (result.affectedRows === 0) {
      console.warn(
        `No matching token_address found for ${tokenAddress} in wallet_balance during PNL update.`
      );
    } else {
      console.log("PNL updated in the database successfully.");
    }
  } catch (error) {
    console.error("Error calculating and storing PNL in DB:", error.message);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
  }
}

// async function fetchWalletBalanceDB(token) {
//   try {
//     const query = `SELECT * FROM wallet_balance WHERE token_address = ${token.baseToken.address}`;
//   } catch (error) {
//     console.error(
//       "Error querying fetchWalletBalance from Database",
//       error.message
//     );
//   }
// }

module.exports = {
  storeWalletBalanceDBPre,
  storeWalletBalanceDBPost,
  storeWalletBalanceDBPNL,
  // fetchWalletBalanceDB,
};
