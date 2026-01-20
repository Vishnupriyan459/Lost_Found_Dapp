import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles, Shield, Coins, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ItemGrid } from '@/components/items/ItemGrid';
import { SearchFilters } from '@/components/items/SearchFilters';
import { LostItem } from '@/types';
import heroPattern from '@/assets/hero-pattern.jpg';
import { fetch_public_missing_items } from '@/service/fetchItems';
import { useAuthStore } from '@/stores/authStore'; // <-- Use your Zustand auth token

const features = [
  { icon: Search, title: 'Smart Matching', description: 'Advanced search to find lost items quickly' },
  { icon: Coins, title: 'Token Rewards', description: 'Earn FND tokens for helping others' },
  { icon: Shield, title: 'Verified Claims', description: 'Secure verification process' },
  { icon: Users, title: 'Campus Community', description: 'Connect with fellow students' },
];

export default function Index() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  const token = useAuthStore((s) => s.token); // read user token

  // ---------------- FETCH ITEMS ----------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetch_public_missing_items(token ?? "");
        console.log("API DATA:", data);

        // Map API response shape → UI shape
        const mapped: LostItem[] = data.map((it: any) => ({
          id: it._id,
          title: it.title,
          description: it.description,
          category: it.category,
          location: {
            coordinates: it.location?.coordinates,
            place: it.location?.place
          },
          photos: [], // Currently none
          reward: { amount: it.reward?.amount ?? 0 },
          attributes: it.attributes,
          status: it.status?.toLowerCase() || "open",
          owner_id: it.owner_id,
          claims_count: it.claims_count ?? 0,
          created_at: it.created_at,
          updated_at: it.last_activity_at
        }));

        setItems(mapped);
      } catch (err) {
        console.error("Failed to load public items:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  // ---------------- FILTERS ----------------
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || category === 'all' || item.category === category;
      const matchesStatus = !status || status === 'all' || item.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, category, status]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="container relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" /> Web3-Powered Campus Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-4xl font-bold text-foreground sm:text-5xl md:text-6xl"
            >
              Find What's <span className="gradient-text">Lost</span>,
              <br className="hidden sm:block" /> Earn <span className="gradient-text-accent">Rewards</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 text-lg text-muted-foreground md:text-xl"
            >
              The campus lost & found platform that rewards good deeds with FND tokens.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button asChild variant="hero" size="xl">
                <Link to="/register">
                  Get Started <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="xl">
                <Link to="#explore">Explore Items</Link>
              </Button>
            </motion.div>
          </div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="group rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* LIST ITEMS */}
      <section id="explore" className="container py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl text-foreground">Lost Items</h2>
            <p className="mt-1 text-muted-foreground">Browse recently reported items</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
            {filteredItems.filter((i) => i.status === 'open').length} open items
          </div>
        </div>

        <SearchFilters
          search={search}
          category={category}
          status={status}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onClear={clearFilters}
        />

        <div className="mt-8">
          <ItemGrid items={filteredItems} loading={loading} />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-muted/30 to-background">
        <div className="container py-16 md:py-20 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Lost Something?</h2>
          <p className="mb-8 text-muted-foreground">Post with a reward and let students help you find it.</p>
          <Button asChild variant="hero" size="lg">
            <Link to="/post-item">
              Post a Lost Item <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
