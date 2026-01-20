import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { ethers } = hre;

async function main() {
  const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
  const systemKey = process.env.SYSTEM_PRIVATE_KEY;

  if (!tokenAddress) throw new Error("TOKEN_CONTRACT_ADDRESS missing in .env");
  if (!systemKey) throw new Error("SYSTEM_PRIVATE_KEY missing in .env");

  // Load signer (system account)
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const systemWallet = new ethers.Wallet(systemKey, provider);

  console.log("Minting using system wallet:", systemWallet.address);

  // Load token contract
  const token = await ethers.getContractAt("FindToken", tokenAddress, systemWallet);

  // Amount = 100 tokens (18 decimals)
  const amount = ethers.parseUnits("100", 18);

  const tx = await token.mint(systemWallet.address, amount);
  console.log("Mint tx hash:", tx.hash);

  await tx.wait();
  console.log("✔ Minted 100 tokens to:", systemWallet.address);
}

main().catch(console.error);
