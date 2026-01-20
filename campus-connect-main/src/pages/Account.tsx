import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wallet,
  Copy,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { Transaction } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useWalletStore } from "@/stores/walletStore";
import { fetchBalance } from "@/service/fetchBalance";

/* MAPPING UI CONFIG */
const txTypeConfig: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  lock: { label: "Lost", icon: ArrowUpRight, className: "text-warning" },
  transfer: { label: "Found", icon: ArrowDownLeft, className: "text-success" },
  reward: { label: "Reward", icon: RefreshCw, className: "text-info" },
  recoil: { label: "Mint-Reconcile", icon: RefreshCw, className: "text-info" },
  refund: { label: "Refund", icon: RefreshCw, className: "text-info" }
};

/* TRANSFORMER – convert backend response → frontend format */
function normalizeTx(tx: any): Transaction {
  const t = tx?.type?.toLowerCase();

  // const normalizedType =
  //   t === "lost" ? "lock" :
  //   t === "reward" ? "transfer" :
  //   t === "mint-reconcile" ? "recoil" :
  //   t; // fallback raw type
  const normalizedType =
  t === "lost" ? "lock" :
  t === "mint-reconcile" ? "recoil" :
  t=== "found" ? "transfer" :
  t=== "reward" ? "reward" :
  t=="refund" ? "refund" :
  t; // reward stays reward


  return {
    id: tx._id || tx.id,
    from_address: tx.sender,
    to_address: tx.receiver,
    amount: tx.tokenAmount ?? tx.amount ?? 0,
    type: normalizedType,
    item_id: tx.itemId,
    timestamp: tx.date ?? tx.timestamp,
    tx_hash: tx.hash,
  } as Transaction;
}

export default function Account() {
  const { user, token } = useAuthStore();
  const { balance, setBalance, setHistory } = useWalletStore();

  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!user?.accountAddress) return;
    navigator.clipboard.writeText(user.accountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Address copied!" });
  };
  useEffect(() => {
  const load = async () => {
    const t = token || localStorage.getItem("token");
    if (!t) return;
    const res = await fetchBalance(t);
    setBalance(res.balance);
    const cleaned = (res.history || []).map(normalizeTx);
    setHistory(cleaned);
    setTransactions(cleaned);
  };

  load();
}, []);
  /* LOAD BALANCE + TRANSACTIONS */
  useEffect(() => {
    if (!token) return;
    fetchBalance(token).then((res) => {
      setBalance(res.balance);
      const cleaned = (res.history || []).map(normalizeTx);
      setHistory(cleaned);
      setTransactions(cleaned);
    });
  }, [token]);

  /* STATS */
  const stats = {
    earned: transactions.filter((t) => t.type === "transfer").reduce((a, b) => a + b.amount, 0),
    locked: transactions.filter((t) => t.type === "lock").reduce((a, b) => a + b.amount, 0),
    refunded: transactions.filter((t) => t.type === "refund").reduce((a, b) => a + b.amount, 0),
  };

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-8 text-3xl font-bold text-foreground">Account & Wallet</h1>

        {/* Profile */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <span className="text-2xl font-bold text-primary">
                  {user?.fullName?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{user?.fullName}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-muted px-3 py-1 text-sm">
                  {user?.accountAddress || "0x..."}
                </code>
                <Button variant="ghost" size="icon" onClick={copyAddress}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="mb-8 rounded-2xl border border-token/30 bg-gradient-to-br from-token/10 to-token/5 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-token shadow-token">
              <Wallet className="h-8 w-8 text-token-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">FND Token Balance</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-token">{balance}</span>
              <span className="text-xl font-medium text-token">FND</span>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-6">
            <h2 className="font-semibold text-foreground">Transaction History</h2>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const config = txTypeConfig[tx.type] || {
                  label: "Unknown",
                  icon: RefreshCw,
                  className: "text-muted-foreground",
                };
                const TxIcon = config.icon;

                return (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${config.className}`}>
                        <TxIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-semibold ${config.className}`}>
                        {tx.type === "lock" ? "-" : "+"}{tx.amount} FND
                      </p>
                      {tx.item_id && (
                        <Link
                          to={`/item/${tx.item_id}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View item <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
