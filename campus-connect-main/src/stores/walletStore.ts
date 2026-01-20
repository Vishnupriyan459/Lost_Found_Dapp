import { create } from "zustand";

interface TxHistory {
  _id: string;
  sender: string;
  receiver: string;
  tokenAmount: number;
  date: string;
  type: string;
  description?: string;
  itemId?: string;
}

interface WalletState {
  balance: number;
  history: TxHistory[];
  setBalance: (bal: number) => void;
  setHistory: (h: TxHistory[]) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  history: [],
  setBalance: (bal) => set({ balance: bal }),
  setHistory: (h) => set({ history: h }),
}));
