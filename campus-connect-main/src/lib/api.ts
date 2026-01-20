import { useAuthStore } from '@/stores/authStore';
import { ApiResponse, LostItem, Claim, User, Notification, Transaction } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'An error occurred',
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auth API
export const authApi = {
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    accountAddress: string;
  }) =>
    fetchWithAuth<{ user: User; token: string }>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    fetchWithAuth<{ user: User; token: string }>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => fetchWithAuth<User>('/api/users/profile'),
};

// Items API
export const itemsApi = {
  getPublicItems: (params?: {
    category?: string;
    status?: string;
    search?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return fetchWithAuth<LostItem[]>(`/api/items/public${query ? `?${query}` : ''}`);
  },

  getMyItems: () => fetchWithAuth<LostItem[]>('/api/items/my'),

  getItemById: (id: string) => fetchWithAuth<LostItem>(`/api/items/${id}`),

  createItem: (formData: FormData) =>
    fetchWithAuth<LostItem>('/api/items/', {
      method: 'POST',
      body: formData,
    }),

  closeItem: (itemId: string) =>
    fetchWithAuth<LostItem>('/api/items/close', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId }),
    }),
};

// Claims API
export const claimsApi = {
  getClaimsForItem: (itemId: string) =>
    fetchWithAuth<Claim[]>(`/api/claims/?item_id=${itemId}`),

  getMyClaims: () => fetchWithAuth<Claim[]>('/api/claims/my'),

  createClaim: (formData: FormData) =>
    fetchWithAuth<Claim>('/api/claims/', {
      method: 'POST',
      body: formData,
    }),

  acceptClaim: (itemId: string, claimId: string) =>
    fetchWithAuth<Claim>('/api/claims/accept', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, claim_id: claimId }),
    }),

  rejectClaim: (itemId: string, claimId: string) =>
    fetchWithAuth<Claim>('/api/claims/reject', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, claim_id: claimId }),
    }),
};

// Notifications API (mock for now)
export const notificationsApi = {
  getNotifications: () => fetchWithAuth<Notification[]>('/api/notifications'),
  markAsRead: (id: string) =>
    fetchWithAuth<void>(`/api/notifications/${id}/read`, { method: 'POST' }),
};

// Transactions API (mock for now)
export const transactionsApi = {
  getTransactions: () => fetchWithAuth<Transaction[]>('/api/transactions'),
  getBalance: () => fetchWithAuth<{ balance: number }>('/api/wallet/balance'),
};
