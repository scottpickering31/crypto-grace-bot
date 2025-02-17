const { fetch } = require("cross-fetch");
const { connection, wallet } = require("./config");
const {
  VersionedTransaction,
  ComputeBudgetProgram,
} = require("@solana/web3.js");
const {
  telegramMessage,
} = require("../integration/telegramApi/telegramMessage");
const { monitorTokenPrice } = require("../services/monitorTokenPrice");
const {
  storeWalletBalanceDBPre,
} = require("../integration/database/walletBalanceDB");

const submitBuySwap = async (token) => {
  console.log("Starting submitBuySwap for token:", token.baseToken.name);
  const inputMint = `So11111111111111111111111111111111111111112`; // SOL mint address
  const outputMint = token.baseToken.address;
  console.log("Input Mint:", inputMint);
  console.log("Output Mint:", outputMint);

  const walletBalance = await connection.getBalance(wallet.payer.publicKey);
  console.log("Wallet Balance (lamports):", walletBalance);

  if (walletBalance < 0.02 * 10 ** 9) {
    console.error("Insufficient SOL balance. Minimum 0.02 SOL required.");
    return;
  }

  const amount = Math.floor(walletBalance / 2);
  console.log("Amount to swap (lamports):", amount);

  try {
    console.log("Fetching swap quote...");
    const quoteResponse = await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`
      )
    ).json();

    if (!quoteResponse || !quoteResponse.routePlan) {
      console.error("Invalid quote response:", quoteResponse);
      return;
    }
    console.log("Quote Response:", JSON.stringify(quoteResponse, null, 2));

    console.log("Fetching swap transaction...");
    const { swapTransaction } = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          dynamicSlippage: { maxBps: 1000 },
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              maxLamports: 10000000,
              priorityLevel: "veryHigh",
            },
          },
        }),
      })
    ).json();

    console.log("Swap Transaction (Base64):", swapTransaction);
    console.log("Deserializing transaction...");
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    console.log("Adding Compute Budget Instructions...");
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_295_080 })
    );

    console.log("Signing transaction...");
    transaction.sign([wallet.payer]);

    console.log("Fetching latest block hash...");
    const latestBlockHash = await connection.getLatestBlockhash();
    console.log("Latest Block Hash:", latestBlockHash);

    console.log("Sending transaction...");
    const rawTransaction = transaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });
    console.log("Transaction ID:", txid);

    console.log("Confirming transaction...");
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid,
    });
    console.log("Transaction confirmed:", txid);

    const date = new Date();
    const formattedTime = date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const amountInSol = amount / 10 ** 9;
    const message = `${token.baseToken.name} bought for ${amountInSol} SOL at ${formattedTime}.`;
    console.log("Sending Telegram message:", message);
    telegramMessage(message);

    console.log("Storing wallet balance in the database...");
    await storeWalletBalanceDBPre(walletBalance, token, txid);

    console.log(`Monitoring price for token: ${outputMint}`);
    monitorTokenPrice(token);
  } catch (error) {
    console.error("Error during submitBuySwap:", error);
  }
};

module.exports = { submitBuySwap };
