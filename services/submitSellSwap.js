const { fetch } = require("cross-fetch");
const { connection, wallet } = require("./config");
const { VersionedTransaction, PublicKey } = require("@solana/web3.js");
const {
  telegramMessage,
} = require("../integration/telegramApi/telegramMessage");
const {
  storeWalletBalanceDBPost,
  storeWalletBalanceDBPNL,
} = require("../integration/database/walletBalanceDB");

const waitForToken = async (mintAddress, retries = 10, interval = 5000) => {
  const mintPublicKey = new PublicKey(mintAddress);

  for (let i = 0; i < retries; i++) {
    console.log(`Checking for token: Attempt ${i + 1}/${retries}`);
    const tokenAccounts = await connection.getTokenAccountsByOwner(
      wallet.payer.publicKey,
      { mint: mintPublicKey },
      { commitment: "confirmed" }
    );

    if (tokenAccounts.value.length > 0) {
      console.log("Token found in wallet.");
      return tokenAccounts.value[0].pubkey;
    }

    console.log("Token not found. Retrying...");
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error("Token did not appear in wallet within the expected time.");
};

const submitSellSwap = async (token) => {
  console.log("Starting submitSellSwap for token:", token.baseToken.name);

  const inputMint = token.baseToken.address;
  const outputMint = `So11111111111111111111111111111111111111112`;
  const walletBalance = await connection.getBalance(wallet.payer.publicKey);

  try {
    console.log("Waiting for token to appear in wallet...");
    const tokenAccountPubKey = await waitForToken(inputMint);

    const tokenBalance = await connection.getTokenAccountBalance(
      tokenAccountPubKey
    );
    const amount = Math.floor(
      tokenBalance.value.uiAmount * Math.pow(10, tokenBalance.value.decimals)
    );

    if (!amount || amount <= 0) {
      console.error("Invalid token amount calculated for swap.");
      return;
    }

    console.log(
      `Token Balance for ${token.baseToken.name}:`,
      tokenBalance.value.uiAmount,
      `(${amount} lamports)`
    );

    if (amount <= 0) {
      console.log("Insufficient token balance to perform swap.");
      return;
    }

    // Fetching quote
    console.log("Fetching swap quote...");
    const quoteResponse = await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}\
&outputMint=${outputMint}\
&amount=${amount}\
&slippageBps=50`
      )
    ).json();
    console.log("Quote Response:", JSON.stringify(quoteResponse, null, 2));

    // Fetching swap transaction
    console.log("Fetching swap transaction...");
    const { swapTransaction } = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicSlippage: { maxBps: 1000 },
          dynamicComputeUnitLimit: true,
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

    // Deserialize the transaction
    console.log("Deserializing transaction...");
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log("Deserialized Transaction:", transaction);

    // Sign the transaction
    console.log("Signing transaction...");
    transaction.sign([wallet.payer]);

    // Get the latest block hash
    console.log("Fetching latest block hash...");
    const latestBlockHash = await connection.getLatestBlockhash();
    console.log("Latest Block Hash:", latestBlockHash);

    // Execute the transaction
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

    // Log and monitor
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
    const message = `${token.baseToken.name} sold for ${amountInSol} SOL at ${formattedTime}.`;
    console.log("Sending Telegram message:", message);
    telegramMessage(message);

    console.log("Storing wallet balance in the database...");
    await storeWalletBalanceDBPost(walletBalance, token);
    await storeWalletBalanceDBPNL(token);

    // console.log("Triggering flush-bot...");
    // const executeBotSequence = async () => {
    //   try {
    //     // Step 1: Stop the bot
    //     console.log("Stopping bot...");
    //     await apiRoutes("stop-bot");

    //     // Step 2: Flush the bot 3 seconds later
    //     setTimeout(async () => {
    //       console.log("Flushing bot...");
    //       await apiRoutes("flush-bot");
    //     }, 3000);

    //     // Step 3: Stop the bot again 39 seconds after flushing
    //     setTimeout(async () => {
    //       console.log("Stopping bot after flushing...");
    //       await apiRoutes("stop-bot");

    //       // Step 4: Start the bot 2 seconds after the second stop
    //       setTimeout(async () => {
    //         console.log("Starting bot...");
    //         await apiRoutes("start-bot");
    //         console.log("Bot started.");
    //       }, 2000); // 2 seconds after stop-bot
    //     }, 39000); // 39 seconds after flushing
    //   } catch (error) {
    //     console.error("Error executing bot sequence:", error);
    //   }
    // };

    // executeBotSequence();
  } catch (error) {
    console.error("Error during submitSellSwap:", error.message);
  }
};

module.exports = { submitSellSwap };
