import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ITEM_CATEGORIES, ItemCategory } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface SearchFiltersProps {
  search: string;
  category: string;
  status: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onClear: () => void;
}

export function SearchFilters({
  search,
  category,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilters = search || category || status;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lost items..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-12 pl-10 pr-4 text-base"
          />
        </div>
        <Button
          variant={showFilters ? 'secondary' : 'outline'}
          size="icon"
          className="h-12 w-12"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 rounded-xl bg-muted/50 p-4">
              <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={onClear}>
                  <X className="mr-1 h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Tags */}
      {hasFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
              "{search}"
              <button onClick={() => onSearchChange('')}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {category && category !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
              {category}
              <button onClick={() => onCategoryChange('all')}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {status && status !== 'all' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm capitalize">
              {status}
              <button onClick={() => onStatusChange('all')}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
