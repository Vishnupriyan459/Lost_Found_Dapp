import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, Plus, Wallet, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useState } from 'react';

const navLinks = [
  { label: 'Explore', href: '/' },
  { label: 'Dashboard', href: '/dashboard', auth: true },
  { label: 'My Claims', href: '/claims', auth: true },
];

export function Header() {
  const location = useLocation();
  const { isAuthenticated, user, fndBalance, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-glow"
          >
            <Search className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="text-xl font-bold text-foreground">
            Campus<span className="text-primary">Find</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) =>
            !link.auth || isAuthenticated ? (
              <Link
                key={link.href}
                to={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            ) : null
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Token Balance */}
              <div className="hidden items-center gap-2 rounded-full bg-token/10 px-3 py-1.5 sm:flex">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-token shadow-token">
                  <span className="text-[10px] font-bold text-token-foreground">F</span>
                </div>
                <span className="text-sm font-semibold text-token">{fndBalance} FND</span>
              </div>

              {/* Post Item Button */}
              <Button asChild variant="hero" size="sm" className="hidden sm:flex">
                <Link to="/post-item">
                  <Plus className="h-4 w-4" />
                  Post Item
                </Link>
              </Button>

              {/* Notifications */}
              <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Account & Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <Link to="/login" className="flex items-center gap-2">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="hero">
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-2">
                {navLinks.map((link) =>
                  !link.auth || isAuthenticated ? (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ) : null
                )}
                {isAuthenticated && (
                  <Link
                    to="/post-item"
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Post Lost Item
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
