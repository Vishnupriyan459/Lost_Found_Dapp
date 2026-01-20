import Transaction from "../models/Transaction.js";
// import LostItem from "../models/LostItem.js";    

// -------- Get account balance & history --------
export async function getAccount(req, res) {
  try {
    const userId = req.user._id;

    let account = await Transaction.findOne({ userId });
    if (!account) {
      // If account does not exist, create one with 0 balance
      account = await Transaction.create({ userId, balance: 0, history: [] });
    }

    res.json({
      balance: account.balance,
      history: account.history.sort((a, b) => b.date - a.date) // newest first
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch account info" });
  }
}

// -------- Add a transaction (e.g., reward, lost/found) --------
export async function addTransaction(req, res) {
  try {
    const userId = req.user._id;
    const { sender, receiver, tokenAmount, itemId, type } = req.body;

    if (!sender || !receiver || !tokenAmount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find user's account
    let account = await Transaction.findOne({ userId });
    if (!account) {
      account = await Transaction.create({ userId, balance: 0, history: [] });
    }

    // Update balance based on type (simple logic)
    if (type === "Reward" || type === "Found") {
      account.balance += tokenAmount;
    } else if (type === "Lost") {
      account.balance -= tokenAmount;
    }

    // Add transaction history
    account.history.push({ sender, receiver, tokenAmount, itemId, type, date: new Date() });

    await account.save();

    res.json({ message: "Transaction added successfully", account });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add transaction" });
  }
}
