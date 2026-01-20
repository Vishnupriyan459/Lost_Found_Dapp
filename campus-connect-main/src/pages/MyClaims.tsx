import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { Claim } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { fetch_claims_by_finder } from "@/service/fetchItems";

const claimStatusConfig: Record<string, any> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border border-warning/20" },
  verified: { label: "Verified", className: "bg-success/10 text-success border border-success/20" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border border-destructive/20" },
};

function getCategoryEmoji(category: string): string {
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

export default function MyClaims() {
  const { isAuthenticated, token } = useAuthStore();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch_claims_by_finder(token);

        const normalizedClaims = (res.claims || []).map((c: any) => ({
          ...c,
          id: c._id,
          claim_id: c.claim_id || c._id,
          status: c.status ? c.status.toLowerCase() : "pending",
        }));

        setClaims(normalizedClaims);
      } catch (err) {
        console.error("MyClaims Load Error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  // 🚫 Guard: Not signed in
  if (!isAuthenticated) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Sign in Required</h1>
        <p className="mb-6 text-muted-foreground">Please sign in to view your claims</p>
        <Button asChild variant="hero">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Claims</h1>
          <p className="mt-2 text-muted-foreground">Track status of all claims you submitted</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-10">Loading...</p>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              🔍
            </div>
            <h3 className="mb-2 font-semibold text-foreground">No Claims Found</h3>
            <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
              Browse lost items and submit claims to earn FND tokens
            </p>
            <Button asChild variant="hero">
              <Link to="/">Browse Items</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim, index) => (
              <motion.div
                key={claim.claim_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/item/${claim.item_id}`}
                  className="group block rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <span className="text-3xl">
                        {getCategoryEmoji(claim.item?.category || "Other")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                          {claim.item?.title}
                        </h3>
                        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${claimStatusConfig[claim.status]?.className}`}>
                          {claimStatusConfig[claim.status]?.label}
                        </span>
                      </div>

                      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                        {claim.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Found at: {claim.evidence?.location_found?.place}</span>
                        <span>•</span>
                        <span>
                          Submitted{" "}
                          {formatDistanceToNow(new Date(claim.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="token-badge">{claim.item?.reward?.amount} FND</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
