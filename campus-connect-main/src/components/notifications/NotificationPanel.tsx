import { useNotificationStore } from '@/stores/notificationStore';
import { Bell, Check, Package, Search, X, Coins, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Notification } from '@/types';

const iconMap: Record<Notification['type'], React.ReactNode> = {
  item_created: <Package className="h-4 w-4 text-primary" />,
  claim_submitted: <Search className="h-4 w-4 text-info" />,
  claim_verified: <Check className="h-4 w-4 text-success" />,
  claim_rejected: <X className="h-4 w-4 text-destructive" />,
  item_closed: <Package className="h-4 w-4 text-muted-foreground" />,
  reward_credited: <Coins className="h-4 w-4 text-token" />,
  reward_refunded: <Coins className="h-4 w-4 text-warning" />,
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    onClose();
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold">Notifications</h3>
        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
          Mark all read
        </Button>
      </div>
      <ScrollArea className="h-80">
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              to={notification.item_id ? `/item/${notification.item_id}` : '#'}
              onClick={() => handleNotificationClick(notification)}
              className={`block px-4 py-3 transition-colors hover:bg-muted/50 ${
                !notification.read ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {iconMap[notification.type] || <AlertCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
