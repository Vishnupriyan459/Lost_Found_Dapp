export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'Student' | 'Staff' | 'Admin'| 'Other';
  accountAddress: string;
  createdAt: string;
}

export interface Location {
  coordinates: [number, number];
  place: string;
}

export interface Reward {
  amount: number;
  status?: 'locked' | 'transferred' | 'refunded';
}

export interface ItemAttributes {
  [key: string]: string;
}

export interface LostItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: Location;
  photos: string[];
  preferred_pickup_instructions?: string;
  reward: Reward;
  attributes: ItemAttributes;
  status: 'Open' | 'Matched' | 'Closed';
  owner_id: string;
  owner?: User;
  claims_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClaimEvidence {
   photos?: string[];
  location_found: Location;
}

export interface Claim {
  id?: string;                 // 👈 add this (UI compatibility)
  claim_id?: string; 
  item_id: string;
  item?: LostItem;
  finder_id: string;
  finder?: User;
  message: string;
  // evidence_photos: string[];
  evidence: ClaimEvidence;
  attributes: ItemAttributes;
  contact_info: {
    phone?: string;
    email?: string;
  };
  status: 'Pending' | 'Verified' | 'Rejected';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'item_created' | 'claim_submitted' | 'claim_verified' | 'claim_rejected' | 'item_closed' | 'reward_credited' | 'reward_refunded';
  title: string;
  message: string;
  item_id?: string;
  claim_id?: string;
  read: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  from_address: string;
  to_address: string;
  amount: number;
  type: 'lock' | 'transfer' | 'refund';
  item_id: string;
  item?: LostItem;
  timestamp: string;
  tx_hash?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type ItemCategory = 
  | 'Electronics'
  | 'Accessories'
  | 'Documents'
  | 'Clothing'
  | 'Books'
  | 'Keys'
  | 'Wallet'
  | 'Watch'
  | 'Bag'
  | 'Other';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Electronics',
  'Accessories',
  'Documents',
  'Clothing',
  'Books',
  'Keys',
  'Wallet',
  'Watch',
  'Bag',
  'Other',
];
