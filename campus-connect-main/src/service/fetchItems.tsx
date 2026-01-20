

const API_URL = import.meta.env.VITE_API_URL;
export async function fetch_public_missing_items(token: string) {
  const res = await fetch(`${API_URL}/api/items/public`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function fetch_close_items(token: string,item_id:string) {
  const res = await fetch(`${API_URL}/api/items/close`, {
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({item_id}),
    method: 'POST',
  });
  return res.json();
}

/**
 * Fetch items owned by the logged-in user
 * GET /api/items/mine
 */
export async function fetch_my_items(token: string) {
  const res = await fetch(`${API_URL}/api/items/myitems`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return res.json();
}

/**
 * Fetch claims submitted by user (finder)
 * GET /api/claims/finder/:id
 * If you want default auto-id: backend will use req.user.id
 */
export async function fetch_claims_by_finder(token: string, finderId?: string) {
  const url = finderId
    ? `${API_URL}/api/claims/myclaims/${finderId}`
    : `${API_URL}/api/claims/myclaims`; // we recommend backend alias /me

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
}

export async function fetch_item_by_id(token?: string, itemId?: string) {
  const headers: any = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/items/${itemId}`, {
    method: "GET",
    headers
  });

  return res.json();
}



