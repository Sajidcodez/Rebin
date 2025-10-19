import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { CommunityService } from "../../lib/services/CommunityService";
import { SupabaseCommunityRepository } from "../../lib/repositories/CommunityRepository";
import { Notification } from "../../lib/repositories/CommunityRepository";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface NotificationCenterProps {
  className?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onAction?: (action: Notification["action"]) => void;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onAction: (action: Notification["action"]) => void;
}

// ============================================================================
// NOTIFICATION ITEM COMPONENT
// ============================================================================

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onAction,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMarkAsRead = useCallback(() => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
  }, [notification.id, notification.read, onMarkAsRead]);

  const handleAction = useCallback(() => {
    if (notification.action) {
      onAction?.(notification.action);
    }
  }, [notification.action, onAction]);

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "achievement":
        return Icons.trophy;
      case "challenge":
        return Icons.target;
      case "leaderboard":
        return Icons.barChart;
      case "community":
        return Icons.users;
      case "system":
        return Icons.info;
      default:
        return Icons.bell;
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "achievement":
        return "text-yellow-600 bg-yellow-100";
      case "challenge":
        return "text-blue-600 bg-blue-100";
      case "leaderboard":
        return "text-green-600 bg-green-100";
      case "community":
        return "text-purple-600 bg-purple-100";
      case "system":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const NotificationIcon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  return (
    <div
      className={cn(
        "notification-item flex items-start p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer",
        !notification.read && "bg-blue-50 border-l-4 border-l-blue-500"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleMarkAsRead}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleMarkAsRead()}
      aria-label={`${notification.title} notification, ${formatTimeAgo(
        notification.createdAt
      )}`}
    >
      <div className="flex-shrink-0 mr-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            iconColor
          )}
        >
          <NotificationIcon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-sm font-medium truncate",
                !notification.read ? "text-gray-900" : "text-gray-700"
              )}
            >
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>

          <div className="flex items-center space-x-2 ml-2">
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
        </div>

        {notification.action && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
              className="text-xs"
            >
              {notification.action.type === "navigate" && "View"}
              {notification.action.type === "join_challenge" &&
                "Join Challenge"}
              {notification.action.type === "view_achievement" &&
                "View Achievement"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// NOTIFICATION DROPDOWN COMPONENT
// ============================================================================

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onAction,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
        role="menu"
        aria-label="Notifications"
      >
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMarkAllAsRead}
                className="text-xs"
                aria-label="Mark all notifications as read"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Icons.bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No notifications yet</p>
            </div>
          ) : (
            <div role="list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onAction={onAction}
                />
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => {
                // TODO: Navigate to all notifications page
                console.log("View all notifications");
                onClose();
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

// ============================================================================
// MAIN NOTIFICATION CENTER COMPONENT
// ============================================================================

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
  const { user } = useAuth();
  const { showInfo } = useToastNotifications();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize community service
  const communityService = useMemo(() => {
    if (!user) return null;

    const repository = new SupabaseCommunityRepository(supabase, {
      info: (msg, meta) => console.log(msg, meta),
      error: (msg, meta) => console.error(msg, meta),
      warn: (msg, meta) => console.warn(msg, meta),
      debug: (msg, meta) => console.debug(msg, meta),
    });

    return new CommunityService(
      repository,
      {} as any, // User repository - would be injected in real app
      {} as any, // Achievement service - would be injected in real app
      {} as any, // Notification service - would be injected in real app
      {} as any, // Analytics service - would be injected in real app
      {
        info: (msg, meta) => console.log(msg, meta),
        error: (msg, meta) => console.error(msg, meta),
        warn: (msg, meta) => console.warn(msg, meta),
        debug: (msg, meta) => console.debug(msg, meta),
      }
    );
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!communityService || !user) return;

    try {
      setIsLoading(true);
      const notificationsData = await communityService.getNotifications(
        user.id,
        20
      );
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [communityService, user]);

  // Mark notification as read
  const handleMarkAsRead = useCallback(
    async (notificationId: string) => {
      if (!communityService) return;

      try {
        await communityService.markNotificationAsRead(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [communityService]
  );

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!communityService || !user) return;

    try {
      await communityService.markAllNotificationsAsRead(user.id);

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [communityService, user]);

  // Handle notification action
  const handleAction = useCallback((action: Notification["action"]) => {
    if (!action) return;

    switch (action.type) {
      case "navigate":
        // TODO: Navigate to the specified path
        console.log("Navigate to:", action.data.path);
        break;
      case "join_challenge":
        // TODO: Join the specified challenge
        console.log("Join challenge:", action.data.challengeId);
        break;
      case "view_achievement":
        // TODO: View the specified achievement
        console.log("View achievement:", action.data.achievementId);
        break;
    }
  }, []);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload);

          const newNotification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            action: payload.new.action,
            read: payload.new.read,
            createdAt: new Date(payload.new.created_at),
          };

          // Add to notifications list
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          showInfo(newNotification.title, {
            description: newNotification.message,
            action: newNotification.action
              ? {
                  label: "View",
                  onClick: () => handleAction(newNotification.action!),
                }
              : undefined,
          });
        }
      )
      .subscribe((status) => {
        console.log("Notification subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showInfo, handleAction]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (!user) {
    return null;
  }

  return (
    <div className={cn("notification-center relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label={`Notifications ${
          unreadCount > 0 ? `(${unreadCount} unread)` : ""
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icons.bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        notifications={notifications}
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onAction={handleAction}
      />
    </div>
  );
};

export default NotificationCenter;
