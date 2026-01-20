// controllers/itemsController.js
import { plugin, startSession } from 'mongoose';
import Item from '../models/Item.js';
import Claim from '../models/claim.js';
import User from '../models/User.js';
import Notification from '../models/notification.js';
import { v4 as uuidv4 } from 'uuid';
import { userToSystemTransfer,transferToUser,mintAndTransferToUser } from '../services/tokenService.js';
import Transaction from '../models/Transaction.js';
/*transaction */

async function transactionLog(userId, sender, receiver, tokenAmount, itemId, type) {
  if (!userId || !sender || !receiver || !type) {
    throw new Error("Missing required fields for transaction log");
  }

  let account = await Transaction.findOne({ userId });
  if (!account) {
    account = await Transaction.create({
      userId,
      balance: 0,
      history: []
    });
  }

  if (type === "Reward" || type === "Found") {
    account.balance += Number(tokenAmount);
  } else if (type === "Lost") {
    account.balance -= Number(tokenAmount);
  }

  account.history.push({
    sender,
    receiver,
    tokenAmount: Number(tokenAmount),
    itemId,
    type,
    date: new Date()
  });

  await account.save();
}


/**
 * Helpers
 */
function sendNotification(userId, type, payload = {}) {
  // create notification doc (no await here in helpers; controller awaits)
  return new Notification({
    _id: uuidv4(),
    user_id: userId,
    type,
    payload,
    read: false,
    created_at: new Date()
  });
}

/**
 * Create a lost item (owner)
 * Expects: req.user (with id), body: { title, description, category, location: { coordinates }, photos?, reward? }
 */

// export async function createItem(req, res) {
//   try {
//     const ownerId = req.user?.id;
//     if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

//     const user = await User.findById(ownerId).lean();
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const {
//       title,
//       description = "",
//       category,
//       location,
//       photos: photosFromBody = [],
//       preferred_pickup_instructions = "",
//       reward = {},
//       attributes = {},
//       meta = {},
//     } = req.body;

//     if (!title || !category || !location?.coordinates || !Array.isArray(location.coordinates)) {
//       return res.status(400).json({
//         error: "Missing required fields: title, category, location.coordinates",
//       });
//     }

//     // Photos
//     let photos = Array.isArray(photosFromBody) ? photosFromBody : [];
//     if (Array.isArray(req.files) && req.files.length > 0) {
//       photos = req.files.map((f) => f.buffer);
//     }

//     // 🔐 User → System transfer only if reward > 0
//     let transaction = null;
//     if (reward?.amount && reward.amount > 0) {
//       transaction = await userToSystemTransfer(user.walletSet, reward.amount);
//       await transactionLog(ownerId, transaction.from, "SYSTEM", reward.amount, undefined, "Lost");
//     }

//     const newItem = new Item({
//       _id: uuidv4(),
//       owner_id: ownerId,
//       title: title.trim(),
//       description,
//       category,
//       photos,
//       location: {
//         type: "Point",
//         coordinates: location.coordinates,
//         place: location.place || "",
//       },
//       preferred_pickup_instructions,
//       reward: {
//         amount: Number(reward.amount) || 0,
//         currency: reward.currency || "FND",
//       },
//       attributes,
//       status: "Open",
//       created_at: new Date(),
//       last_activity_at: new Date(),
//       meta: {
//         visibility: meta.visibility || "Campus",
//         is_public: true,
//       },
//     });

//     if (transaction) {
//       await transactionLog(ownerId, transaction.from, "SYSTEM", reward.amount, newItem._id, "Lost");
//     }

//     await newItem.save();

//     const notif = sendNotification(ownerId, "item_created", {
//       item_id: newItem._id,
//       title: newItem.title,
//     });
//     await notif.save();

//     return res.status(201).json({ message: "Item created", item: newItem });
//   } catch (err) {
//     console.error("createItem", err);
//     return res.status(500).json({ error: "Failed to create item" });
//   }
// }
export async function createItem(req, res) {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(ownerId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      title,
      description = "",
      category,
      location,
      photos: photosFromBody = [],
      preferred_pickup_instructions = "",
      reward = {},
      attributes = {},
      meta = {}
    } = req.body;

    if (!title || !category || !location?.coordinates || !Array.isArray(location.coordinates)) {
      return res.status(400).json({
        error: "Missing required fields: title, category, location.coordinates"
      });
    }

    // Handle binary photo uploads
    let photos = Array.isArray(photosFromBody) ? photosFromBody : [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      photos = req.files.map(f => f.buffer);
    }

    // 🔐 Transfer user reward to system ONLY ONCE
    let tx = null;
    let rewardAmount = Number(reward.amount) || 0;

    if (rewardAmount > 0) {
      // walletSet must exist on user doc
      if (!user.walletSet) {
        return res.status(400).json({ error: "Invalid wallet set on user record" });
      }

      tx = await userToSystemTransfer(user.walletSet, rewardAmount);
    }

    // 🆕 Create Item
    const newItem = new Item({
      _id: uuidv4(),
      owner_id: ownerId,
      title: title.trim(),
      description,
      category,
      photos,
      location: {
        type: "Point",
        coordinates: location.coordinates,
        place: location.place || ""
      },
      preferred_pickup_instructions,
      reward: {
        amount: rewardAmount,
        currency: reward.currency || "FND"
      },
      attributes,
      status: "Open",
      created_at: new Date(),
      last_activity_at: new Date(),
      meta: {
        visibility: meta.visibility || "Campus",
        is_public: true
      }
    });

    await newItem.save();

    // 🧾 Log Balance Change ONLY AFTER Item Exists
    if (tx) {
      await transactionLog(ownerId, tx.from, "SYSTEM", rewardAmount, newItem._id, "Lost");
    }

    // 🔔 Notify Owner (success)
    const notif = sendNotification(ownerId, "item_created", {
      item_id: newItem._id,
      title: newItem.title
    });
    await notif.save();

    return res.status(201).json({
      message: "Item created successfully",
      item: newItem,
      tokenTx: tx || null
    });

  } catch (err) {
    console.error("createItem", err);

    return res.status(500).json({
      error: "Failed to create item",
      details: err.message
    });
  }
}


/**
 * Get single item by ID (Frontend Item Detail Page)
 * GET /api/items/:id
 */
export async function getItemById(req, res) {
  try {
    const userId = req.user?.id;
    const itemId = req.params.id;

    if (!itemId) return res.status(400).json({ error: "item_id required" });
    
    const item = await Item.findById(itemId).lean();
    if (!item) return res.status(404).json({ error: "Item not found" });

    // 👉 Fetch Owner profile
    const owner = await User.findById(item.owner_id)
      .select("fullName email role accountAddress")
      .lean();

    let response = {
      item: {
        ...item,
        owner, // ⬅️ Now frontend receives owner.fullName etc
      }
    };

    // OWNER VIEW — full claims
    if (userId && item.owner_id === userId) {
      const claims = await Claim.find({ item_id: item._id }).lean();

      // Fetch all finder users (one DB round)
      const finderIds = [...new Set(claims.map(c => c.finder_id))];
      const finderUsers = await User.find({ _id: { $in: finderIds } })
        .select("fullName email role accountAddress")
        .lean();
      const finderMap = Object.fromEntries(
        finderUsers.map(u => [u._id.toString(), u])
      );

      const claimsEnriched = claims.map(c => ({
        ...c,
        claim_id: c._id,
        finder: finderMap[c.finder_id?.toString()] || null
      }));

      response.claims = claimsEnriched;
      return res.json(response);
    }

    // FINDER / PUBLIC VIEW — safe claim data
    const publicClaims = await Claim.find(
      { item_id: item._id },
      { contact_info: 0, photos: 0, evidence: 0 }
    ).lean();

    const finderIds = [...new Set(publicClaims.map(c => c.finder_id))];
    const finderUsers = await User.find({ _id: { $in: finderIds } })
      .select("fullName")
      .lean();
    const finderMap = Object.fromEntries(
      finderUsers.map(u => [u._id.toString(), u])
    );

    const claimsSafe = publicClaims.map(c => ({
      claim_id: c._id,
      item_id: c.item_id,
      finder_id: c.finder_id,
      finder: finderMap[c.finder_id?.toString()] || null, // ⬅️ allowed safe finder info
      status: c.status,
      message: c.message,
      created_at: c.created_at
    }));

    response.claims = claimsSafe;
    return res.json(response);

  } catch (err) {
    console.error("getItemById", err);
    return res.status(500).json({ error: "Failed to fetch item details" });
  }
}

/**
 * List items created by the logged-in owner
 * GET /api/items/mine
 */
export async function listMyItems(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { status, limit = 50, skip = 0 } = req.query;

    // Owner filter
    const filter = { owner_id: userId };

    if (status && status !== "all") {
      filter.status = status;
    }

    const items = await Item.find(filter)
      .select("-photos")              // do NOT send heavy binary
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    return res.json({
      count: items.length,
      items
    });

  } catch (err) {
    console.error("listMyItems", err);
    return res.status(500).json({ error: "Failed to fetch your items" });
  }
}


export async function submitClaim(req, res) {
  try {

    const finderId = req.user && req.user.id;
    if (!finderId) return res.status(401).json({ error: 'Unauthorized' });

    // ⬅️ DO NOT destructure evidence as const
    const { item_id, message = '', contact_info = {}} = req.body;

    
    if (!item_id) return res.status(400).json({ error: 'item_id is required' });

    const item = await Item.findById(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.owner_id === finderId) {
      return res.status(400).json({ error: 'Owner cannot file a claim on their own item' });
    }

    let parsedAttributes = {};
    if (req.body.attributes && typeof req.body.attributes === 'object') {
      parsedAttributes = req.body.attributes;
    }

    
    
    // ✅ Collect photos
    const photos = Array.isArray(req.files)
      ? req.files.map(f => f.buffer)
      : [];

    // ✅ Build final evidence object
    const evidence = {
      ...req.body.evidence,
      photos
    };

    // ✅ Duplicate check (NOW WORKS)
    const existing = await Claim.findOne({
      item_id,
      finder_id: finderId,
      'evidence.location_found.coordinates': evidence?.location_found?.coordinates
    });

    if (existing) {
      return res.status(409).json({ error: 'Duplicate claim detected' });
    }

    const claim = new Claim({
      _id: uuidv4(),
      item_id,
      finder_id: finderId,
      message,
      evidence,
      status: 'Pending',
      attributes: parsedAttributes,
      contact_info,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await claim.save();

    item.last_activity_at = new Date();
    await item.save();

    const notif = sendNotification(item.owner_id, 'claim_created', {
      claim_id: claim._id,
      item_id: item._id,
      finder_id: finderId
    });
    await notif.save();

    return res.status(201).json({ message: 'Claim submitted', claim });

  } catch (err) {
    console.error('submitClaim', err);
    return res.status(500).json({ error: 'Failed to submit claim' });
  }
}


/**
 * List claims for an item (owner or admin)
 * Query params: item_id
 */
export async function listClaimsForItem (req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { item_id } = req.query;
    if (!item_id) return res.status(400).json({ error: 'item_id required' });

    const item = await Item.findById(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Only owner or admin should see full claims (partial visibility could be implemented)
    if (item.owner_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const claims = await Claim.find({ item_id }).sort({ created_at: -1 });
    return res.json(claims);
  } catch (err) {
    console.error('listClaimsForItem', err);
    return res.status(500).json({ error: 'Failed to fetch claims' });
  }
}

/**List items with claim by the user */
export async function getClaimsByFinder(req, res) {
  try {
    const finderId = req.params.finder_id || req.user?.id;
    if (!finderId) return res.status(400).json({ error: "finder_id required" });

    // 1️⃣ fetch claims of finder
    const claims = await Claim.find({ finder_id: finderId });

    if (!claims || claims.length === 0) {
      return res.json({ message: "No claims found", data: [] });
    }

    // 2️⃣ fetch matching items
    const itemIds = claims.map(c => c.item_id);
    const items = await Item.find({ _id: { $in: itemIds } })
      .lean()
      .exec();

    // 3️⃣ merge claims + item details
    const merged = claims.map(claim => {
      const item = items.find(i => i._id === claim.item_id);
      return {
        claim_id: claim._id,
        item_id: claim.item_id,
        finder_id: claim.finder_id,
        message: claim.message,
        status: claim.status,
        created_at: claim.created_at,
        updated_at: claim.updated_at,
        item
      };
    });

    return res.json({ count: merged.length, claims: merged });

  } catch (err) {
    console.error("getClaimsByFinder", err);
    res.status(500).json({ error: "Failed to fetch finder claims" });
  }
}
/**
 * Accept / verify a claim (owner verifies finder)
 * Body: { item_id, claim_id }
 *
 * This is atomic: sets claim.status='Verified', item.status='Matched', item.matched_claim_id,
 * rejects all other claims, and notifies the finder and other claimants.
 */
export async function acceptClaim(req, res) {
  try {
    const ownerId = req.user && req.user.id;
    if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

    const { item_id, claim_id } = req.body || {};
    if (!item_id || !claim_id) {
      return res.status(400).json({ error: 'item_id and claim_id required' });
    }

    const item = await Item.findById(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.owner_id !== ownerId) {
      return res.status(403).json({ error: 'Only owner can accept claims' });
    }

    if (item.status === 'Closed') {
      return res.status(400).json({ error: 'Item already closed' });
    }

    const claim = await Claim.findOne({ _id: claim_id, item_id });
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    if (claim.status !== 'Pending') {
      return res.status(400).json({ error: 'Claim not in pending state' });
    }

    // ✅ Accept claim
    claim.status = 'Verified';
    claim.updated_at = new Date();
    await claim.save();

    // ✅ Update item
    item.status = 'Matched';
    item.matched_claim_id = claim._id;
    item.last_activity_at = new Date();
    await item.save();

    // ✅ Reject other pending claims
    await Claim.updateMany(
      { item_id, _id: { $ne: claim._id }, status: 'Pending' },
      { $set: { status: 'Rejected', updated_at: new Date() } }
    );

    // ✅ Notifications
    await sendNotification(
      claim.finder_id,
      'claim_verified',
      { claim_id: claim._id, item_id: item._id }
    ).save();

    const otherClaims = await Claim.find({ item_id, _id: { $ne: claim._id } });
    for (const c of otherClaims) {
      await sendNotification(
        c.finder_id,
        'claim_rejected',
        { claim_id: c._id, item_id: item._id }
      ).save();
    }

    return res.json({ message: 'Claim accepted and item matched' });

  } catch (err) {
    console.error('acceptClaim', err);
    return res.status(500).json({ error: 'Failed to accept claim' });
  }
}


/**
 * Reject a single claim (owner or admin)
 * Body: { claim_id }
 */
export async function rejectClaim(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { claim_id } = req.body || {};
    if (!claim_id) {
      return res.status(400).json({ error: 'claim_id required' });
    }

    const claim = await Claim.findById(claim_id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const item = await Item.findById(claim.item_id);
    if (!item) return res.status(404).json({ error: 'Related item not found' });

    if (item.owner_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (claim.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending claims can be rejected' });
    }

    claim.status = 'Rejected';
    claim.updated_at = new Date();
    await claim.save();

    item.last_activity_at = new Date();
    await item.save();

    await sendNotification(
      claim.finder_id,
      'claim_rejected',
      { claim_id: claim._id, item_id: item._id }
    ).save();

    return res.json({ message: 'Claim rejected', claim });

  } catch (err) {
    console.error('rejectClaim', err);
    return res.status(500).json({ error: 'Failed to reject claim' });
  }
}


/**
 * Owner marks item as received/closed after pickup (close workflow)
 * Body: { item_id }
 */




export async function closeItem(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { item_id} = req.body;
    if (!item_id) return res.status(400).json({ error: "item_id required" });

    const item = await Item.findById(item_id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.owner_id !== userId) {
      return res.status(403).json({ error: "Only owner can close item" });
    }

    if (item.status === "Closed") {
      return res.status(400).json({ error: "Item already closed" });
    }

    const rewardAmount = item.reward?.amount || 0;

    // Prevent double payout
    if (item.reward_sent) {
      return res.status(400).json({ error: "Reward already processed" });
    }

    // CASE 1️⃣ Finder exists → pay finder
    if (item.matched_claim_id) {
      const matched = await Claim.findById(item.matched_claim_id);
      if (!matched) return res.status(400).json({ error: "Matched claim not found" });

      // Get finder wallet
      const finder = await User.findById(matched.finder_id);
      if (!finder || !finder.accountAddress) {
        return res.status(400).json({ error: "Finder wallet missing" });
      }

      const tx = await transferToUser(rewardAmount, finder.accountAddress);

      await transactionLog(
        matched.finder_id,
        "SYSTEM",
        finder.accountAddress,
        rewardAmount,
        item._id,
        "Reward"
      );

      await sendNotification(matched.finder_id, "reward_received", {
        item_id: item._id,
        amount: rewardAmount,
      }).save();

      item.reward_sent = true;
    }

    // CASE 2️⃣ No finder → refund owner
    else if (rewardAmount > 0) {
      const owner = await User.findById(userId);
      if (!owner || !owner.accountAddress) {
        return res.status(400).json({ error: "Owner wallet missing" });
      }

      const tx = await transferToUser(rewardAmount, owner.accountAddress);

      await transactionLog(
        userId,
        "SYSTEM",
        owner.accountAddress,
        rewardAmount,
        item._id,
        "Refund"
      );
    }

    // Close Item
    item.status = "Closed";
    item.last_activity_at = new Date();
    await item.save();

    return res.json({
      message: item.matched_claim_id
        ? "Item closed and reward sent to finder"
        : "Item closed and reward refunded to owner",
      item
    });

  } catch (err) {
    console.error("closeItem", err);
    return res.status(500).json({ error: "Failed to close item" });
  }
}



/**
 * Public listing: search / feed of items
 * Query: ?q=text&lng=..&lat=..&maxDistance=meters&status=Open
 */
export async function listPublicItems(req, res) {
  try {
    const userId = req.user?.id;  // logged-in user (may be null for unauthenticated users)

    const {
      q,
      lng,
      lat,
      maxDistance = 50000,
      status = "Open",
      limit = 50,
      skip = 0
    } = req.query;

    const filter = { status };

    // text search
    if (q) filter.$text = { $search: q };

    // geo filter
    if (lng && lat) {
      filter.location = {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(maxDistance)
        }
      };
    }

    // 🔐 respect visibility
    filter["meta.is_public"] = true;

    // 🚨 exclude owner's own items if authenticated
    if (userId) {
      filter.owner_id = { $ne: userId };
    }

    const docs = await Item.find(filter)
      .select("-photos")
      .sort({ created_at: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error("listPublicItems", err);
    return res.status(500).json({ error: "Failed to list items" });
  }
}



/**
 * Submit a claim (finder) — multipart version (files uploaded via multer)
 * Expects same body fields as submitClaim, but files under req.files
 */
export async function submitClaimMultipart (req, res) {
  try {
    const finderId = req.user && req.user.id;
    if (!finderId) return res.status(401).json({ error: 'Unauthorized' });

    // Accept item_id and other fields either in req.body or query as before
    const { item_id, message = '', evidence = {}, contact_info = {}, attributes = {} } = req.body;
    if (!item_id) return res.status(400).json({ error: 'item_id is required' });

    const item = await Item.findById(item_id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.owner_id === finderId) {
      return res.status(400).json({ error: 'Owner cannot file a claim on their own item' });
    }

    // Prevent duplicate identical claims from same finder for same item
    const existing = await Claim.findOne({
      item_id,
      finder_id: finderId,
      'evidence.location_found.coordinates': evidence?.location_found?.coordinates
    });
    if (existing) {
      return res.status(409).json({ error: 'Duplicate claim detected' });
    }

    // Collect photos from multipart upload (req.files)
    let photos = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      photos = req.files.map(f => f.buffer);
    }

    const claim = new Claim({
      _id: uuidv4(),
      item_id,
      finder_id: finderId,
      message,
      photos,
      evidence: evidence || {},
      status: 'Pending',
      attributes: attributes,
      contact_info,
      created_at: new Date(),
      updated_at: new Date()
    });

    await claim.save();

    // update item's last_activity_at and status -> keep Open but mark activity
    item.last_activity_at = new Date();
    await item.save();

    // create notification for owner
    const notif = sendNotification(item.owner_id, 'claim_created', { claim_id: claim._id, item_id: item._id, finder_id: finderId });
    await notif.save();

    return res.status(201).json({ message: 'Claim submitted', claim });
  } catch (err) {
    console.error('submitClaimMultipart', err);
    return res.status(500).json({ error: 'Failed to submit claim' });
  }
}
