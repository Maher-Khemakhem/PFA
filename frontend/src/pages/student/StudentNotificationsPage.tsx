import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import {
  fetchNotifications, markNotificationAsRead,
  markAllNotificationsAsRead, deleteNotification,
  addProjectMember, createNotification, fetchProject,
} from '@/lib/api';
import { Notification, Project } from '@/lib/types';
import { Bell, CheckCheck, Trash2, ListTodo, FolderKanban, CalendarDays, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const typeIcons = { task: ListTodo, project: FolderKanban, event: CalendarDays, system: Settings };
const typeColors = {
  task: 'bg-primary/10 text-primary',
  project: 'bg-warning/10 text-warning',
  event: 'bg-success/10 text-success',
  system: 'bg-muted text-muted-foreground',
};

function extractEmail(value: string) {
  return value.match(/[^\s@]+@[^\s@]+\.[^\s@.,;:]+/)?.[0] || '';
}

export default function StudentNotificationsPage() {
  const { userEmail } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', userEmail],
    queryFn: () => fetchNotifications(userEmail),
    enabled: Boolean(userEmail),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userEmail] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(userEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userEmail] });
      toast.success('Toutes les notifications marquées comme lues');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userEmail] });
      toast.success('Notification supprimée');
    },
  });

  const approveJoinMutation = useMutation({
    mutationFn: async (notification: Notification) => {
      const requesterEmail = extractEmail(notification.message);
      const projectId = notification.relatedEntityId;

      if (!requesterEmail || !projectId) {
        throw new Error('Demande incomplete');
      }

      const project = await fetchProject(projectId);
      if (project.chefDeProjet !== userEmail) {
        throw new Error('Acces refuse');
      }

      await addProjectMember(projectId, requesterEmail);
      await markNotificationAsRead(notification.id);
      await createNotification({
        userId: requesterEmail,
        titre: 'Demande de projet approuvee',
        message: `Votre demande pour rejoindre le projet a ete approuvee.`,
        type: 'SUCCESS',
        relatedEntityType: 'PROJECT',
        relatedEntityId: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Demande approuvee');
    },
    onError: () => {
      toast.error("Impossible d'approuver la demande");
    },
  });

  const declineJoinMutation = useMutation({
    mutationFn: async (notification: Notification) => {
      const requesterEmail = extractEmail(notification.message);
      const projectId = notification.relatedEntityId;

      if (!requesterEmail || !projectId) {
        throw new Error('Demande incomplete');
      }

      const project = await fetchProject(projectId);
      if (project.chefDeProjet !== userEmail) {
        throw new Error('Acces refuse');
      }

      await markNotificationAsRead(notification.id);
      await createNotification({
        userId: requesterEmail,
        titre: 'Demande de projet refusee',
        message: `Votre demande pour rejoindre le projet a ete refusee.`,
        type: 'WARNING',
        relatedEntityType: 'PROJECT',
        relatedEntityId: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', userEmail] });
      toast.success('Demande refusee');
    },
    onError: () => {
      toast.error("Impossible de refuser la demande");
    },
  });

  const joinRequests = notifications.filter(n => n.relatedEntityType === 'PROJECT_JOIN_REQUEST');
  const projectQueries = useQueries({
    queries: joinRequests.map((n) => ({
      queryKey: ['project', n.relatedEntityId],
      queryFn: () => fetchProject(n.relatedEntityId || ''),
      enabled: Boolean(n.relatedEntityId),
      staleTime: 60_000,
    })),
  });

  const projectsById = joinRequests.reduce<Record<string, Project | null>>(
    (acc, n, index) => {
      const projectId = n.relatedEntityId || '';
      acc[projectId] = projectQueries[index]?.data ?? null;
      return acc;
    },
    {}
  );

  const unread = notifications.filter(n => !n.lu).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">Notifications</h1>
            {unread > 0 && (
              <span className="h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center">
                {unread} non lue{unread > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} className="gap-1">
              <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => {
              const Icon = typeIcons[n.type];
              const isJoinRequest = n.relatedEntityType === 'PROJECT_JOIN_REQUEST';
              const project = isJoinRequest ? projectsById[n.relatedEntityId || ''] : null;
              const isChef = Boolean(project && project.chefDeProjet === userEmail);
              return (
                <div key={n.id} className={cn('bg-card rounded-xl border p-4 flex items-start gap-4 transition-colors', !n.lu && 'border-primary/30 bg-primary/5')}>
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', typeColors[n.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{n.titre}</p>
                      {!n.lu && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isJoinRequest && isChef && (
                      <Button
                        size="sm"
                        onClick={() => approveJoinMutation.mutate(n)}
                        disabled={approveJoinMutation.isPending}
                      >
                        Approuver
                      </Button>
                    )}
                    {isJoinRequest && isChef && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => declineJoinMutation.mutate(n)}
                        disabled={declineJoinMutation.isPending}
                      >
                        Refuser
                      </Button>
                    )}
                    {!n.lu && (
                      <Button variant="ghost" size="sm" onClick={() => markAsReadMutation.mutate(n.id)}>
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
