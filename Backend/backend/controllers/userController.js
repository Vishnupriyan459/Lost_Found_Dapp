import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ethers } from "ethers";
// import { mintTokens } from "../services/tokenService.js";// optional, if using ERC20
import Transaction from "../models/Transaction.js";
import {transferToUser,mintAndTransferToUser,getBalances} from "../services/tokenService.js";
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";
import { SERVER_START_ID } from "../config/Server.js";
export async function registerUser(req, res) {
  try {
    const { fullName, email, password, role, accountAddress } = req.body;

    if (!fullName || !email || !password || !accountAddress) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      fullName,
      email,
      passwordHash,
      role: role || "Student",
      accountAddress,
    });
    // Mint and transfer 100 tokens to new user
    const tx=await transferToUser(100,accountAddress);
    console.log(tx);
    
    // Create transaction account in DB with initial 100 tokens
    await Transaction.findOneAndUpdate(
  { userId: newUser._id },
  {
    $inc: { balance: 100 },
    $push: {
      history: {
        sender: "SYSTEM",
        receiver: accountAddress,
        tokenAmount: 100,
        type: "Reward",
        description: "Initial registration reward",
        date: new Date()
      }
    }
  },
  { upsert: true, new: true }
);


    return res.status(201).json({
      message: "User registered successfully with 100 tokens",
      user: newUser,
      // transaction: txHash, // keep commented for now
    });
  } catch (error) {
    console.error("Error in registerUser:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
}


// -------- Login User --------
// export async function loginUser(req, res) {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) return res.status(400).json({ error: "Email and password required" });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     // Compare password
//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

//     // Generate JWT
//     const token = jwt.sign(
//       { id: user._id, email: user.email, role: user.role },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );
//     //Check the balance
//     const transaction = await Transaction.findOne({ userId: user._id });
//     console.log("User balance:", transaction ? transaction.balance : 0);
//     const onChainBalance = await tokenContract.balanceOf(user.accountAddress);

//     mintAndTransferToUser(user.accountAddress, transaction.balance || 0);

//     return res.json({ message: "Login successful", token, user, balance: transaction.balance || 0 });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Login failed" });
//   }
// }

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    // 1) Try to atomically claim the reconciliation for this server run.
    // This returns the previous doc (or null) if it matched and updated.
    const filter = { userId: user._id, $or: [{ lastReconciledServerId: { $exists: false } }, { lastReconciledServerId: { $ne: SERVER_START_ID } }] };
    const update = { $set: { lastReconciledServerId: SERVER_START_ID } };
    const options = { new: false }; // returns the pre-update doc
    const prevDoc = await Transaction.findOneAndUpdate(filter, update, options);

    // If prevDoc is null => either there is no Transaction doc at all or lastReconciledServerId already equals SERVER_START_ID.
    // We need to handle both cases:
    let transactionDoc = prevDoc;
    if (!transactionDoc) {
      // There are two reasons: (A) no Transaction doc exists at all -> we should create one (and we "own" reconcile),
      // or (B) lastReconciledServerId already equals SERVER_START_ID -> someone else already reconciled.
      // To detect which, fetch the doc:
      transactionDoc = await Transaction.findOne({ userId: user._id });
      if (!transactionDoc) {
        // No transaction doc exists — create one and mark as reconciled (we own it).
        transactionDoc = await Transaction.create({
          userId: user._id,
          balance: 0,
          lastReconciledServerId: SERVER_START_ID,
          history: []
        });
        // At this point we are the reconciler.
      } else if (transactionDoc.lastReconciledServerId === SERVER_START_ID) {
        // Someone already reconciled for this server run -> skip reconciliation.
        return res.json({
          message: "Login successful (already reconciled for this run)",
          token,
          user,
          balance: transactionDoc.balance || 0
        });
      } else {
        // transactionDoc exists but lastReconciledServerId !== SERVER_START_ID; this means our earlier findOneAndUpdate failed to match
        // (probably because of a race) — attempt an atomic claim again:
        const tryClaim = await Transaction.findOneAndUpdate(
          { userId: user._id, lastReconciledServerId: { $ne: SERVER_START_ID } },
          { $set: { lastReconciledServerId: SERVER_START_ID } },
          { new: false }
        );
        if (!tryClaim) {
          // someone else claimed it in the meantime -> skip reconcile
          return res.json({
            message: "Login successful (reconciliation already in progress or done)",
            token,
            user,
            balance: transactionDoc.balance || 0
          });
        }
      }
    }

    // If we reach here, we own the reconciliation for this user for this server run.
    const dbBalance = transactionDoc.balance || 0;
    // console.log(dbBalance,await getBalances(user.accountAddress) );
    
    // 2) Get on-chain balance
    // const onChainBN = await getBalances(user.accountAddress); // BigNumber expected
    // const onChain = ethers.BigNumber.from(onChainBN || 0);
    // const dbBN = ethers.BigNumber.from(dbBalance);

    // if (onChain.gte(dbBN)) {
    //   // Nothing to mint. But ensure DB reflects on-chain if onChain > DB (optional)
    //   if (!onChain.eq(dbBN)) {
    //     // Update DB to reflect on-chain (so UI shows real on-chain balance)
    //     await Transaction.findOneAndUpdate(
    //       { userId: user._id },
    //       { $set: { balance: onChain.toString() } }
    //     );
    //   }

    //   return res.json({
    //     message: "Login successful (no mint needed)",
    //     token,
    //     user,
    //     balance: onChain.toString()
    //   });
    // }

    // assume getBalances returns a numeric string or number of token base units
    const onChainRaw = await getBalances(user.accountAddress); // e.g. "500" or 500
    // Convert to BigInt safely (ensures integers only)
const onChainBI = BigInt(String(Math.floor(Number(onChainRaw) || 0)));
const dbBI = BigInt(String(Math.floor(Number(dbBalance) || 0)));

if (onChainBI >= dbBI) {
  // On-chain has equal or more tokens → no mint required
  // Optional: update DB to reflect real on-chain balance
  await Transaction.findOneAndUpdate(
    { userId: user._id },
    { $set: { balance: onChainBI.toString() } }
  );

  return res.json({
    message: "Login successful (no mint needed)",
    token,
    user,
    balance: onChainBI.toString()
  });

} else {
  // DB says more tokens than on-chain → mint the difference
  const amountToMintBI = dbBI - onChainBI;

  const tx = await mintAndTransferToUser(amountToMintBI.toString(), user.accountAddress);
  if (tx && tx.wait) await tx.wait();

  await Transaction.findOneAndUpdate(
    { userId: user._id },
    {
      $set: { balance: dbBI.toString() },
      $push: {
        history: {
          sender: "SYSTEM",
          receiver: user.accountAddress,
          tokenAmount: amountToMintBI.toString(),
          type: "Mint-Reconcile",
          description: "Reconciled balance after restart",
          date: new Date()
        }
      }
    }
  );

  return res.json({
    message: "Login successful (reconciled & minted)",
    token,
    user,
    balance: dbBI.toString()
  });
}


    // 3) Only mint the difference (dbBN - onChain)
    const amountToMint = dbBN.sub(onChain);
    // call your mint function which mints tokens to address
    const mintTx = await mintAndTransferToUser(user.accountAddress, amountToMint.toString()); // ensure mintTo handles BigNumbers/strings

    // wait for confirmation then update DB
    if (mintTx && mintTx.wait) await mintTx.wait();

    // Update DB balance and add history entry atomically
    const updated = await Transaction.findOneAndUpdate(
      { userId: user._id },
      {
        $set: { balance: dbBN.toString() }, // after mint, on-chain should match DB desired balance
        $push: {
          history: {
            sender: "SYSTEM",
            receiver: user.accountAddress,
            tokenAmount: amountToMint.toString(),
            type: "Mint-Reconcile",
            description: "Reconciled balance after restart",
            date: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Login successful (reconciled & minted)",
      token,
      user,
      balance: updated.balance || dbBN.toString()
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
}