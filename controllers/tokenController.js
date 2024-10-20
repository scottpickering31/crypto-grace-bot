const axios = require('axios');
const { tokenInsert } = require('../integration/database/tokenInsert.js');
const db = require('../integration/database/db.js');
const { clearExistingInterval } = require('../integration/intervalManager.js');

const fetchTokensData = async () => {
  try {
    const [latestResponse, topResponse] = await Promise.all([
      axios.get('https://api.dexscreener.com/token-boosts/latest/v1'),
      axios.get('https://api.dexscreener.com/token-boosts/top/v1'),
    ]);

    const latestData = latestResponse.data;
    const topData = topResponse.data;

    return [...latestData, ...topData].filter(
      (item) => item.totalAmount >= 500 && item.chainId === 'solana'
    );
  } catch (error) {
    console.error('Error fetching token data from Dexscreener:', error);
    throw error;
  }
};

const processTokenData = async (filteredData) => {
  const tokenAddresses = filteredData.map((token) => token.tokenAddress);
  const query = `
    SELECT token_address FROM tokens WHERE token_address IN (?)
  `;

  return new Promise((resolve, reject) => {
    db.query(query, [tokenAddresses], async (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        reject(err);
        return;
      }

      const existingTokens = new Set(results.map((row) => row.token_address));
      const tokensToProcess = [];

      for (const token of filteredData) {
        if (!existingTokens.has(token.tokenAddress)) {
          tokensToProcess.push(token);
        } else {
          console.log(
            `Token ${token.tokenAddress} already exists, skipping...`
          );
        }
      }
      resolve(tokensToProcess);
    });
  });
};

const fetchTokenDetails = async (tokenAddress) => {
  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
    );
    return response.data.pairs;
  } catch (error) {
    console.error(`Error fetching token details for ${tokenAddress}:`, error);
    throw error;
  }
};

const startBot = async () => {
  try {
    const filteredData = await fetchTokensData();
    const tokensToProcess = await processTokenData(filteredData);

    if (tokensToProcess.length > 0) {
      for (const token of tokensToProcess) {
        const pairs = await fetchTokenDetails(token.tokenAddress);

        if (pairs && pairs.length > 0) {
          const poolWithHighestLiquidity = pairs.reduce((acc, pair) => {
            if (pair.chainId === 'solana' && pair.dexId === 'raydium') {
              return !acc || pair.liquidity.usd > acc.liquidity.usd
                ? pair
                : acc;
            }
            return acc;
          }, null);

          const currentDateEpoch = new Date().getTime();
          const oneHourInMilliseconds = 60 * 60 * 1000;
          const currentDateGMTPlusOne =
            currentDateEpoch + oneHourInMilliseconds;
          const tokenTime = poolWithHighestLiquidity?.pairCreatedAt;
          const time_difference = Math.floor(
            (currentDateGMTPlusOne - tokenTime) / (1000 * 60)
          );
          console.log(time_difference);

          if (
            poolWithHighestLiquidity &&
            !poolWithHighestLiquidity.moonshot &&
            time_difference <= 100 &&
            poolWithHighestLiquidity.priceUsd > 0.000007 &&
            poolWithHighestLiquidity.priceUsd < 0.0001
          ) {
            clearExistingInterval();
            console.log(`New token found: ${token.tokenAddress}`);
            tokenInsert(poolWithHighestLiquidity, true);
            console.log(`Token ${token.tokenAddress} inserted successfully.`);
          } else {
            console.log(
              `No Raydium pool found for token: ${token.tokenAddress}`
            );
          }
        } else {
          console.log(`Invalid token data for ${token.tokenAddress}`);
        }
      }
      console.log('Data processed successfully');
    }
  } catch (error) {
    console.error('Error in startBot:', error);
  }
};

const flushBot = async () => {
  try {
    const filteredData = await fetchTokensData();

    for (const token of filteredData) {
      const pairs = await fetchTokenDetails(token.tokenAddress);

      if (pairs && pairs.length > 0) {
        const poolWithHighestLiquidity = pairs.reduce((acc, pair) => {
          if (pair.chainId === 'solana' && pair.dexId === 'raydium') {
            return !acc || pair.liquidity.usd > acc.liquidity.usd ? pair : acc;
          }
          return acc;
        }, null);

        if (poolWithHighestLiquidity) {
          console.log(poolWithHighestLiquidity);
          // Insert token without triggering purchase
          tokenInsert(poolWithHighestLiquidity, false);
        } else {
          console.log(`No Raydium pool found for token: ${token.tokenAddress}`);
        }
      } else {
        console.log(`Invalid token data received for: ${token.tokenAddress}`);
      }
    }
    console.log('Flush process completed');
  } catch (error) {
    console.error('Error in flushBot:', error);
  }
};

const stopBot = () => {
  clearExistingInterval();
  console.log('Bot stopped successfully');
};

const sellToken = () => {
  // Implement logic for manual sell (if needed)
};

module.exports = { startBot, stopBot, sellToken, flushBot };
