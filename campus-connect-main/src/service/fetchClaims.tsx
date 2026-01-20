import { log } from "console";

// lib/claims.ts
const BASE_URL = import.meta.env.VITE_API_URL;

export async function submitClaim(formData: FormData, token: string) {
  const res = await fetch(`${BASE_URL}/api/claims`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to submit claim");
  return res.json();
}

export async function acceptClaim(itemId: string, claimId: string, token: string) {
    // console.log("Accepting claim:", { itemId, claimId, token });
  const res = await fetch(`${BASE_URL}/api/claims/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item_id: itemId, claim_id: claimId }),
  });
  if (!res.ok) throw new Error("Failed to accept claim");
  return res.json();
}

export async function rejectClaim(itemId: string, claimId: string, token: string) {
  const res = await fetch(`${BASE_URL}/api/claims/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item_id: itemId, claim_id: claimId }),
  });
  if (!res.ok) throw new Error("Failed to reject claim");
  return res.json();
}

export async function closeItem(itemId: string, token: string) {
  const res = await fetch(`${BASE_URL}/api/items/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item_id: itemId }),
  });
  if (!res.ok) throw new Error("Failed to close item");
  return res.json();
}

export async function getItem(itemId: string, token: string) {
  const res = await fetch(`${BASE_URL}/api/items/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Item not found");
  return res.json();
}

export async function getClaims(itemId: string, token: string) {
  const res = await fetch(`${BASE_URL}/api/claims/?item_id=${itemId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load claims");
  return res.json();
}
