import { ReactNode, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Bell } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotificationsForUsers, getUnreadNotificationCount } from '@/lib/api';
import { toast } from 'sonner';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { userName, userEmail, userRole } = useAuth();
  const showNotifications = userRole === 'student' || userRole === 'organization';
  const orgNotificationIds = [userName, userEmail].filter(Boolean);
  const notificationsUserId = userRole === 'organization' ? (userName || userEmail) : userEmail;
  const notificationsPath = userRole === 'organization'
    ? '/org/notifications'
    : '/student/notifications';
  const queryClient = useQueryClient();
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unreadCount', userRole, notificationsUserId, ...orgNotificationIds],
    queryFn: async () => {
      if (!showNotifications) return 0;
      if (userRole === 'organization') {
        const notifications = await fetchNotificationsForUsers(orgNotificationIds);
        return notifications.filter((n) => !n.lu).length;
      }
      return getUnreadNotificationCount(notificationsUserId);
    },
    enabled: Boolean(notificationsUserId) && showNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    if (!notificationsUserId || !showNotifications) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname || 'localhost';
    const socketIds = userRole === 'organization'
      ? orgNotificationIds
      : [notificationsUserId].filter(Boolean);

    const sockets = socketIds.map((id) => {
      const wsUrl = `${protocol}://${host}:8084/ws/notifications?email=${encodeURIComponent(id)}`;
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as { type?: string; titre?: string; message?: string };
          if (payload.type !== 'connected') {
            if (payload.titre || payload.message) {
              toast(payload.titre || 'Nouvelle notification', {
                description: payload.message || undefined,
              });
            }
            queryClient.invalidateQueries({ queryKey: ['notifications', ...(userRole === 'organization' ? orgNotificationIds : [notificationsUserId])] });
            queryClient.invalidateQueries({ queryKey: ['unreadCount', userRole, notificationsUserId, ...orgNotificationIds] });
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: ['notifications', ...(userRole === 'organization' ? orgNotificationIds : [notificationsUserId])] });
          queryClient.invalidateQueries({ queryKey: ['unreadCount', userRole, notificationsUserId, ...orgNotificationIds] });
        }
      };

      socket.onerror = () => {
        // Keep silent to avoid noisy UI errors
      };

      return socket;
    });

    return () => {
      sockets.forEach((socket) => socket.close());
    };
  }, [notificationsUserId, orgNotificationIds, showNotifications, userRole, queryClient]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground hidden sm:block">Bienvenue, <span className="font-medium text-foreground">{userName}</span></span>
            </div>
            <div className="flex items-center gap-3">
              {showNotifications && (
                <Link to={notificationsPath} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
