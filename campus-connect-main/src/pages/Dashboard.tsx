import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plus, Package, Clock, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";
import { LostItem, Claim } from "@/types";
import { formatDistanceToNow } from "date-fns";

import { fetch_my_items, fetch_claims_by_finder } from "@/service/fetchItems";
import { fetchBalance } from "@/service/fetchBalance";

// UI status (frontend lowercase)
const statusConfig: Record<string, any> = {
  open: {
    label: "Open",
    icon: Clock,
    className:
      "bg-warning/10 text-warning border border-warning/20 rounded-full px-2 py-0.5 text-xs font-medium",
  },
  matched: {
    label: "Matched",
    icon: CheckCircle,
    className:
      "bg-info/10 text-info border border-info/20 rounded-full px-2 py-0.5 text-xs font-medium",
  },
  closed: {
    label: "Closed",
    icon: Package,
    className:
      "bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5 text-xs font-medium",
  },
};


// Claims UI badge style
const claimStatusConfig: Record<string, any> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border border-warning/20" },
  verified: { label: "Verified", className: "bg-success/10 text-success border border-success/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border border-destructive/20" },
};

export default function Dashboard() {
  const { user, fndBalance, setFndBalance, token } = useAuthStore();

  const [myItems, setMyItems] = useState<LostItem[]>([]);
  const [myClaims, setMyClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        setLoading(true);

        // Load owner items
        const itemsRes = await fetch_my_items(token);
        const normalized = (itemsRes.items || []).map((i: any) => ({
          ...i,
          id: i._id,
          status: i.status?.toLowerCase(), // Normalize DB → UI
        }));
        setMyItems(normalized);

        // Load claims
        const claimsRes = await fetch_claims_by_finder(token);
        const normalizedClaims = (claimsRes.claims || []).map((c: any) => ({
          ...c,
          id: c._id,
          claim_id: c.claim_id || c._id,
          status: c.status ? c.status.toLowerCase() : "pending",
        }));

        setMyClaims(normalizedClaims);

        // Load token balance
        const balanceRes = await fetchBalance(token);
        setFndBalance(balanceRes.balance);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const stats = {
    totalItems: myItems.length,
    openItems: myItems.filter((i) => i.status === "Open").length,
    totalClaims: myClaims.length,
    pendingClaims: myClaims.filter((c) => c.status === "Pending").length,
  };

  return (
    <div className="container py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Welcome back, {user?.fullName || "User"}</p>
          </div>
          <Button asChild variant="hero">
            <Link to="/post-item">
              <Plus className="h-4 w-4" /> Post Lost Item
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<Package />} title="Total Items" value={stats.totalItems} />
          <StatCard icon={<Clock />} title="Open Items" value={stats.openItems} />
          <StatCard icon={<AlertCircle />} title="Pending Claims" value={stats.pendingClaims} />
          <StatCard icon={<span className="text-lg">🪙</span>} title="Balance" value={`${fndBalance} FND`} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-items" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-items">My Lost Items</TabsTrigger>
            <TabsTrigger value="my-claims">My Claims</TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="my-items" className="space-y-4">
            {myItems.length === 0 ? (
              <EmptyState
                icon={<Package className="h-12 w-12 text-muted-foreground" />}
                title="No items posted yet"
                subtitle="Post your first lost item to get started"
                actionLabel="Post Lost Item"
                actionLink="/post-item"
              />
            ) : (
              <ItemList items={myItems} />
            )}
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="my-claims" className="space-y-4">
            {myClaims.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
                title="No claims yet"
                subtitle="Browse lost items and help people by submitting claims"
                actionLabel="Browse Items"
                actionLink="/"
              />
            ) : (
              <ClaimList claims={myClaims} />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

/* ------ helpers and sub-components ------ */

function StatCard({ icon, title, value }: any) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, actionLabel, actionLink }: any) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
      {icon}
      <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
      <Button asChild variant="hero">
        <Link to={actionLink}>
          <Plus className="h-4 w-4" /> {actionLabel}
        </Link>
      </Button>
    </div>
  );
}

function ItemList({ items }: { items: LostItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <Link
            to={`/item/${item.id}`}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
              {getCategoryEmoji(item.category)}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.location?.place} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </p>
              {item.claims_count > 0 && <span className="text-info text-sm">{item.claims_count} claims</span>}
            </div>

            <div className="flex items-center gap-3">
              <span className="token-badge">{item.reward.amount} FND</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function ClaimList({ claims }: { claims: Claim[] }) {
  return (
    <div className="space-y-3">
      {claims.map((claim, index) => (
        <motion.div key={claim.claim_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
          <Link
            to={`/item/${claim.item_id}`}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
              {getCategoryEmoji(claim.item?.category || "Other")}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground">{claim.item?.title}</h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">{claim.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Submitted {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
              </p>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${claimStatusConfig[claim.status]?.className}`}>
              {claimStatusConfig[claim.status]?.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function getCategoryEmoji(category: string) {
  const emojiMap: Record<string, string> = {
    Electronics: "📱",
    Accessories: "👜",
    Documents: "📄",
    Clothing: "👕",
    Books: "📚",
    Keys: "🔑",
    Wallet: "👛",
    Watch: "⌚",
    Bag: "🎒",
    Other: "📦",
  };
  return emojiMap[category] || "📦";
}
