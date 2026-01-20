// hardhat.config.cjs
const path = require("path");

// Load .env from same folder
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

require("@nomicfoundation/hardhat-toolbox");

// Load 3 private keys from .env
const systemKey = process.env.SYSTEM_PRIVATE_KEY;
const senderKey = process.env.SENDER_PRIVATE_KEY;
const receiverKey = process.env.RECEIVER_PRIVATE_KEY;

// Check if keys exist
if (!systemKey || !senderKey || !receiverKey) {
    throw new Error("Please set SYSTEM_PRIVATE_KEY, SENDER_PRIVATE_KEY, and RECEIVER_PRIVATE_KEY in your .env file");
}

module.exports = {
    solidity: "0.8.20",

    networks: {
        hardhat: {
            accounts: [
                {
                    privateKey: systemKey,
                    balance: "10000000000000000000000" // 10,000 ETH
                },
                {
                    privateKey: senderKey,
                    balance: "10000000000000000000000"
                },
                {
                    privateKey: receiverKey,
                    balance: "10000000000000000000000"
                }
            ]
        },

        localhost: {
            url: "http://127.0.0.1:8545"
        }
    }
};
