// scripts/balance.js
import hre from "hardhat";
const { ethers } = hre;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
  if (!tokenAddress) {
    throw new Error("TOKEN_CONTRACT_ADDRESS not set in .env");
  }

  const systemPrivateKey = process.env.SYSTEM_PRIVATE_KEY;
  if (!systemPrivateKey) {
    throw new Error("SYSTEM_PRIVATE_KEY not set in .env");
  }

  // connect to local node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // create wallet from private key and connect to provider
  const wallet = new ethers.Wallet(systemPrivateKey, provider);

  // get the public address from wallet (guaranteed to be a hex address)
  const systemAddress = typeof wallet.getAddress === "function"
    ? await wallet.getAddress()
    : wallet.address;

  console.log("Using system address:", systemAddress);
  if (!ethers.isAddress(systemAddress)) {
    throw new Error("Derived systemAddress is not a valid hex address: " + systemAddress);
  }

  // get a contract instance (provider is fine for read-only calls)
  const token = await ethers.getContractAt("FindToken", tokenAddress, provider);

  // read balance
  const bal = await token.balanceOf(systemAddress);
  // adjust decimals if your token uses 18 decimals (most ERC20s do)
  console.log("System token balance:", ethers.formatUnits(bal, 18));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exitCode = 1;
});
