import { motion } from 'framer-motion';
import { MapPin, Clock, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LostItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ItemCardProps {
  item: LostItem;
  index?: number;
}

const statusStyles = {
  open: 'status-open',
  matched: 'status-matched',
  closed: 'status-closed',
};

const statusLabels = {
  open: 'Open',
  matched: 'Matched',
  closed: 'Closed',
};

export function ItemCard({ item, index = 0 }: ItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/item/${item.id}`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card card-hover"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {item.photos && item.photos.length > 0 ? (
            <img
              src={item.photos[0]}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <span className="text-4xl">{getCategoryEmoji(item.category)}</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute left-3 top-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
              {statusLabels[item.status]}
            </span>
          </div>

          {/* Reward Badge */}
          <div className="absolute bottom-3 right-3">
            <div className="token-badge flex items-center gap-1.5">
              <span className="text-xs">🪙</span>
              <span>{item.reward.amount} FND</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {item.category}
            </Badge>
            {item.claims_count !== undefined && item.claims_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MessageCircle className="h-3.5 w-3.5" />
                {item.claims_count}
              </div>
            )}
          </div>

          <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{item.location.place}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    Electronics: '📱',
    Accessories: '👜',
    Documents: '📄',
    Clothing: '👕',
    Books: '📚',
    Keys: '🔑',
    Wallet: '👛',
    Watch: '⌚',
    Bag: '🎒',
    Other: '📦',
  };
  return emojiMap[category] || '📦';
}
