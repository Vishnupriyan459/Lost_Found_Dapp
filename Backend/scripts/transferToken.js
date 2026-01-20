// scripts/transferToken.js
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const { ethers } = hre;

async function main() {
  const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
  const txContractAddress = process.env.TRANSACTION_CONTRACT_ADDRESS;
  const systemKey = process.env.SYSTEM_PRIVATE_KEY;
  const receiver = process.env.SENDER_ADDRESS; // <-- real address

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(systemKey, provider);
  const from = await wallet.getAddress();

  console.log("System Wallet:", from);
  console.log("Receiver:", receiver);

  const amount = ethers.parseUnits("50", 18);

  const token = await ethers.getContractAt("FindToken", tokenAddress, wallet);
  const txContract = await ethers.getContractAt("TokenTransaction", txContractAddress, wallet);

  // ---- STEP 1: Fetch correct nonce BEFORE any tx ----
  let nonce = await provider.getTransactionCount(from, "latest");
  console.log("Starting nonce:", nonce);

  // ---- STEP 2: Approve ----
  console.log("\nApproving...");
  const approveTx = await token.approve(txContractAddress, amount, { nonce });
  await approveTx.wait();
  console.log("✔ Approve TX:", approveTx.hash);

  // increment nonce manually
  nonce++;

  // ---- STEP 3: Transfer ----
  console.log("\nTransferring...");
  const transferTx = await txContract.transferToken(from, receiver, amount, { nonce });
  await transferTx.wait();
  console.log("✔ Transfer TX:", transferTx.hash);

  // ---- STEP 4: Balances ----
  const fromBal = await token.balanceOf(from);
  const recvBal = await token.balanceOf(receiver);

  console.log("\n📌 Final Balances:");
  console.log("System:", ethers.formatUnits(fromBal, 18));
  console.log("Receiver:", ethers.formatUnits(recvBal, 18));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
