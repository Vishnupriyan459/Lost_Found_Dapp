const API_URL = import.meta.env.VITE_API_URL;
export async function fetchBalance(token: string) {
  const res = await fetch(`${API_URL}/api/transactions/balance`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}
