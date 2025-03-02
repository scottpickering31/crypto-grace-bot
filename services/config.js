const { Connection, Keypair } = require("@solana/web3.js");
const bs58 = require("bs58").default;
const { Wallet } = require("@project-serum/anchor");

const HELIUS_KEY = process.env.HELIUS_API_KEY;
const RPC_URL = process.env.RPC_URL;

const connection = new Connection(`${RPC_URL}?api-key=${HELIUS_KEY}`);

const wallet = new Wallet(
  Keypair.fromSecretKey(bs58.decode(process.env.WALLET_PRIVATE_KEY || ""))
);

module.exports = { wallet, connection };
