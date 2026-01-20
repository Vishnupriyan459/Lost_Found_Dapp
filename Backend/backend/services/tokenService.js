// services/tokenService.js
import { JsonRpcProvider, Wallet, Contract, parseUnits, formatUnits,ethers  } from "ethers";
import * as dotenv from "dotenv";
import FindTokenArtifact from "../../artifacts/contracts/Token.sol/FindToken.json" with { type: "json" };
import TokenTransactionArtifact from "../../artifacts/contracts/Transaction.sol/TokenTransaction.json" with { type: "json" };

dotenv.config();

// ---- ENV VARS ----
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const TOKEN_CONTRACT_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS;
const TX_CONTRACT_ADDRESS = process.env.TRANSACTION_CONTRACT_ADDRESS;
const SYSTEM_PRIVATE_KEY = process.env.SYSTEM_PRIVATE_KEY;
const SENDER_PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY;
const RECEIVER_PRIVATE_KEY = process.env.RECEIVER_PRIVATE_KEY;

if (!TOKEN_CONTRACT_ADDRESS) throw new Error("TOKEN_CONTRACT_ADDRESS missing in .env");
if (!TX_CONTRACT_ADDRESS) throw new Error("TRANSACTION_CONTRACT_ADDRESS missing in .env");
if (!SYSTEM_PRIVATE_KEY) throw new Error("SYSTEM_PRIVATE_KEY missing in .env");
if (!SENDER_PRIVATE_KEY) throw new Error("SENDER_PRIVATE_KEY missing");
if (!RECEIVER_PRIVATE_KEY) throw new Error("RECEIVER_PRIVATE_KEY missing");
// ---- BASE SETUP (reused across functions) ----
const provider = new JsonRpcProvider(RPC_URL);
const systemWallet = new Wallet(SYSTEM_PRIVATE_KEY, provider);
const senderWallet = new Wallet(SENDER_PRIVATE_KEY, provider);
const receiverWallet = new Wallet(RECEIVER_PRIVATE_KEY, provider);




const token = new Contract(
  TOKEN_CONTRACT_ADDRESS,
  FindTokenArtifact.abi,
  systemWallet
);

const txContract = new Contract(
  TX_CONTRACT_ADDRESS,
  TokenTransactionArtifact.abi,
  systemWallet
);

// Helper: just to log balances in dev
export async function getBalances(address) {
  const bal = await token.balanceOf(address);
  return formatUnits(bal, 18);
}

export async function getReadableBalance(address) {
  const balBN = await token.balanceOf(address);
  return formatUnits(balBN, 18); // "10.5", "100", etc.
}

export async function getOnChainBalance(address) {
  if (!address) {
    throw new Error("Address is required for on-chain balance lookup");
  }

  try {
    // token already initialized with systemWallet signer at top of file
    const balBN = await token.balanceOf(address);  // returns ethers BigNumber
    return balBN;
  } catch (error) {
    console.error("[getOnChainBalance] Error reading balance:", error);
    throw error;
  }
}

/**
 * 1) OWNER MINT to SYSTEM WALLET
 * This is the owner-only mint step.
 */
export async function mintToSystem(amountTokens) {
  try {
    const systemAddress = await systemWallet.getAddress();
    const amount = parseUnits(amountTokens.toString(), 18);

    console.log(`\n[Mint] Minting ${amountTokens} tokens to system: ${systemAddress}`);

    const tx = await token.mint(systemAddress, amount);
    console.log("[Mint] Tx hash:", tx.hash);
    const receipt = await tx.wait();

    const finalBal = await getBalances(systemAddress);
    console.log("[Mint] System final balance:", finalBal);

    return {
      status: "success",
      step: "mintToSystem",
      txHash: tx.hash,
      systemAddress,
      systemBalance: finalBal,
      receipt,
    };
  } catch (error) {
    console.error("[Mint] Error:", error);
    throw error;
  }
}

/**
 * 2) TRANSFER FROM SYSTEM TO USER (via TokenTransaction contract)
 * Uses approve + transferToken (same as your transferToken.js)
 */
export async function transferToUser(amountTokens, receiverAddress) {
  try {
    const from = await systemWallet.getAddress();
    const amount = parseUnits(amountTokens.toString(), 18);
    console.log("\n[Transfer] System Wallet:", from);
    console.log("[Transfer] Receiver:", receiverAddress);
    console.log("[Transfer] Amount:", amountTokens);

    // STEP 1: nonce before tx
    let nonce = await provider.getTransactionCount(from, "latest");
    console.log("[Transfer] Starting nonce:", nonce);

    // STEP 2: Approve
    console.log("[Transfer] Approving TokenTransaction contract...");
    const approveTx = await token.approve(TX_CONTRACT_ADDRESS, amount, { nonce });
    await approveTx.wait();
    console.log("[Transfer] ✔ Approve TX:", approveTx.hash);

    nonce++;

    // STEP 3: transferToken via TokenTransaction
    console.log("[Transfer] Calling transferToken on txContract...");
    const transferTx = await txContract.transferToken(from, receiverAddress, amount, { nonce });
    await transferTx.wait();
    console.log("[Transfer] ✔ Transfer TX:", transferTx.hash);

    // STEP 4: Balances
    const fromBal = await token.balanceOf(from);
    const recvBal = await token.balanceOf(receiverAddress);

    const systemBalFormatted = formatUnits(fromBal, 18);
    const recvBalFormatted = formatUnits(recvBal, 18);

    console.log("[Transfer] System balance:", systemBalFormatted);
    console.log("[Transfer] Receiver balance:", recvBalFormatted);

    return {
      status: "success",
      step: "transferToUser",
      approveTxHash: approveTx.hash,
      transferTxHash: transferTx.hash,
      systemAddress: from,
      receiverAddress,
      systemBalance: systemBalFormatted,
      receiverBalance: recvBalFormatted,
    };
  } catch (error) {
    console.error("[Transfer] Error:", error);
    throw error;
  }
}

/**
 * 3) (Optional) One-shot: Mint to system then transfer to user
 * Good for your registration flow: call this from your API.
 */
// export async function mintAndTransferToUser(receiverAddress, amountTokens) {
//   // you can decide to mint exactly amountTokens or more
//   // here I'll mint exactly amountTokens to keep it simple
//   const mintResult = await mintToSystem(amountTokens);
//   const transferResult = await transferToUser(receiverAddress, amountTokens);

//   return {
//     status: "success",
//     step: "mintAndTransferToUser",
//     mint: mintResult,
//     transfer: transferResult,
//   };
// }
export async function mintAndTransferToUser(amountTokens, receiverAddress) {
  // 1️⃣ Mint to system
  const mintResult = await mintToSystem(amountTokens);

  // 2️⃣ Transfer from system → fixed receiver
  const transferResult = await transferToUser(amountTokens, receiverAddress);
  const finalreceiverBal = await token.balanceOf(receiverAddress);
  return {
    status: "success",
    step: "mintAndTransferToUser",
    mint: mintResult,
    transfer: transferResult,
    receiver: receiverAddress,
    receiverBalance: formatUnits(finalreceiverBal, 18),
  };
}


/**
 * 4) NORMAL USER → USER DIRECT TRANSFER
 * senderPrivateKey: private key of the user who is sending tokens
 * receiverAddress: destination wallet
 * amountTokens: human-readable (e.g., 10, 50, 100)
 */
export async function userToUserTransfer(senderPrivateKey, receiverAddress, amountTokens) {
  try {
    // Create a wallet for the user (sender)
    const userWallet = new Wallet(senderPrivateKey, provider);
    const from = await userWallet.getAddress();

    // Bind token contract to this user as signer
    const userToken = new Contract(
      TOKEN_CONTRACT_ADDRESS,
      FindTokenArtifact.abi,
      userWallet
    );

    const amount = parseUnits(amountTokens.toString(), 18);

    console.log("\n[UserTransfer] Direct user → user transfer");
    console.log("[UserTransfer] From (sender):", from);
    console.log("[UserTransfer] To (receiver):", receiverAddress);
    console.log("[UserTransfer] Amount:", amountTokens);

    // Call ERC20 transfer
    const tx = await userToken.transfer(receiverAddress, amount);
    console.log("[UserTransfer] Tx hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("[UserTransfer] ✔ Transfer confirmed");

    // Optional: check final balances
    const fromBal = await token.balanceOf(from);              // using system-bound token is fine for read
    const recvBal = await token.balanceOf(receiverAddress);

    const fromBalFormatted = formatUnits(fromBal, 18);
    const recvBalFormatted = formatUnits(recvBal, 18);

    console.log("[UserTransfer] Sender balance:", fromBalFormatted);
    console.log("[UserTransfer] Receiver balance:", recvBalFormatted);

    return {
      status: "success",
      step: "userToUserTransfer",
      txHash: tx.hash,
      senderAddress: from,
      receiverAddress,
      senderBalance: fromBalFormatted,
      receiverBalance: recvBalFormatted,
      receipt,
    };
  } catch (error) {
    console.error("[UserTransfer] Error:", error);
    throw error;
  }
}

/**
 * 5) USER → SYSTEM TRANSFER
 * senderPrivateKey: private key of the user
 * amountTokens: human-readable (e.g., 10, 25)
 */
// export async function userToSystemTransfer(senderPrivateKey, amountTokens) {
//   try {

//     const userWallet = new Wallet(senderPrivateKey, provider);
//     const senderAddress = await userWallet.getAddress();
//     const systemAddress = await systemWallet.getAddress();

//     const userToken = new Contract(
//       TOKEN_CONTRACT_ADDRESS,
//       FindTokenArtifact.abi,
//       userWallet
//     );

//     const amount = parseUnits(amountTokens.toString(), 18);

//     // 🔎 1️⃣ Read user balance BEFORE transfer
//     const userBalanceBN = await token.balanceOf(senderAddress);

//     if (userBalanceBN < amount) {
//       throw new Error(
//         `Insufficient balance. Required: ${amountTokens}, Available: ${formatUnits(userBalanceBN, 18)}`
//       );
//     }

//     if (amount <= 0n) {
//       throw new Error("Transfer amount must be greater than zero");
//     }

//     console.log("\n[User→System] Transfer");
//     console.log("[User→System] From:", senderAddress);
//     console.log("[User→System] To (System):", systemAddress);
//     console.log("[User→System] Amount:", amountTokens);

//     // 🔐 2️⃣ Safe to transfer
//     const tx = await userToken.transfer(systemAddress, amount);
//     console.log("[User→System] Tx hash:", tx.hash);

//     await tx.wait();

//     // 🔎 3️⃣ Final balances (optional, for logs / response)
//     const finalUserBal = await token.balanceOf(senderAddress);
//     const finalSystemBal = await token.balanceOf(systemAddress);

//     return {
//       status: "success",
//       step: "userToSystemTransfer",
//       txHash: tx.hash,
//       from: senderAddress,
//       to: systemAddress,
//       senderBalance: formatUnits(finalUserBal, 18),
//       systemBalance: formatUnits(finalSystemBal, 18),
//     };

//   } catch (error) {
//     console.error("[User→System] Error:", error);
//     throw error;
//   }
// }
export function getWalletBySet(setNumber) {
  const key = setNumber === 2
    ? process.env.RECEIVER_PRIVATE_KEY
    : process.env.SENDER_PRIVATE_KEY;
  return new ethers.Wallet(key, provider);
}

export async function userToSystemTransfer(walletSet, amount) {
  const senderWallet = getWalletBySet(walletSet);
  const senderAddr = await senderWallet.getAddress();
  const systemAddr = await systemWallet.getAddress();

  const token = new Contract(process.env.TOKEN_CONTRACT_ADDRESS, FindTokenArtifact.abi, senderWallet);
  const amountWei = parseUnits(amount.toString(), 18);

  const balance = await token.balanceOf(senderAddr);
  if (balance < amountWei) {
    throw new Error(`Insufficient balance. Required: ${amount}, Available: ${formatUnits(balance, 18)}`);
  }

  const tx = await token.transfer(systemAddr, amountWei);
  await tx.wait();

  return {
    step: "userToSystemTransfer",
    from: senderAddr,
    to: systemAddr,
    amount,
    txHash: tx.hash
  };
}