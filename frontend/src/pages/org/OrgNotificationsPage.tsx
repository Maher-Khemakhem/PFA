import { DashboardLayout } from "@/components/DashboardLayout";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useQueries,
} from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  fetchNotificationsForUsers,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  addProjectMember,
  createNotification,
  fetchProject,
} from "@/lib/api";
import { Notification, Project } from "@/lib/types";
import {
  Bell,
  CheckCheck,
  Trash2,
  ListTodo,
  FolderKanban,
  CalendarDays,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeIcons = {
  task: ListTodo,
  project: FolderKanban,
  event: CalendarDays,
  system: Settings,
};
const typeColors = {
  task: "bg-primary/10 text-primary",
  project: "bg-warning/10 text-warning",
  event: "bg-success/10 text-success",
  system: "bg-muted text-muted-foreground",
};

function extractEmail(value: string) {
  return value.match(/[^\s@]+@[^\s@]+\.[^\s@.,;:]+/)?.[0] || "";
}

export default function OrgNotificationsPage() {
  const { userEmail, userName } = useAuth();
  const notificationsUserId = userName || userEmail;
  const notificationsUserIds = [userName, userEmail].filter(Boolean);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", ...notificationsUserIds],
    queryFn: () => fetchNotificationsForUsers(notificationsUserIds),
    enabled: Boolean(notificationsUserId),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", ...notificationsUserIds],
      });
      queryClient.invalidateQueries({
        queryKey: ["unreadCount", notificationsUserId],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const targets =
        notificationsUserIds.length > 0
          ? notificationsUserIds
          : [notificationsUserId];
      await Promise.all(
        targets.filter(Boolean).map((id) => markAllNotificationsAsRead(id)),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", ...notificationsUserIds],
      });
      queryClient.invalidateQueries({
        queryKey: ["unreadCount", notificationsUserId],
      });
      toast.success("Toutes les notifications marquées comme lues");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", ...notificationsUserIds],
      });
      queryClient.invalidateQueries({
        queryKey: ["unreadCount", notificationsUserId],
      });
      toast.success("Notification supprimée");
    },
  });

  const approveJoinMutation = useMutation({
    mutationFn: async (notification: Notification) => {
      const requesterEmail = extractEmail(notification.message);
      const projectId = notification.relatedEntityId;

      if (!requesterEmail || !projectId) {
        throw new Error("Demande incomplete");
      }

      const project = await fetchProject(projectId);
      if (project.chefDeProjet !== userEmail) {
        throw new Error("Acces refuse");
      }

      await addProjectMember(projectId, requesterEmail);
      await markNotificationAsRead(notification.id);
      await createNotification({
        userId: requesterEmail,
        titre: "Demande de projet approuvee",
        message: `Votre demande pour rejoindre le projet a ete approuvee.`,
        type: "SUCCESS",
        relatedEntityType: "PROJECT",
        relatedEntityId: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", ...notificationsUserIds],
      });
      queryClient.invalidateQueries({
        queryKey: ["unreadCount", notificationsUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Demande approuvee");
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
        throw new Error("Demande incomplete");
      }

      const project = await fetchProject(projectId);
      if (project.chefDeProjet !== userEmail) {
        throw new Error("Acces refuse");
      }

      await markNotificationAsRead(notification.id);
      await createNotification({
        userId: requesterEmail,
        titre: "Demande de projet refusee",
        message: `Votre demande pour rejoindre le projet a ete refusee.`,
        type: "WARNING",
        relatedEntityType: "PROJECT",
        relatedEntityId: projectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", ...notificationsUserIds],
      });
      queryClient.invalidateQueries({
        queryKey: ["unreadCount", notificationsUserId],
      });
      toast.success("Demande refusee");
    },
    onError: () => {
      toast.error("Impossible de refuser la demande");
    },
  });

  const joinRequests = notifications.filter(
    (n) => n.relatedEntityType === "PROJECT_JOIN_REQUEST",
  );
  const projectQueries = useQueries({
    queries: joinRequests.map((n) => ({
      queryKey: ["project", n.relatedEntityId],
      queryFn: () => fetchProject(n.relatedEntityId || ""),
      enabled: Boolean(n.relatedEntityId),
      staleTime: 60_000,
    })),
  });

  const projectsById = joinRequests.reduce<Record<string, Project | null>>(
    (acc, n, index) => {
      const projectId = n.relatedEntityId || "";
      acc[projectId] = projectQueries[index]?.data ?? null;
      return acc;
    },
    {},
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            className="gap-1"
          >
            <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Chargement...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type];
              const isJoinRequest =
                n.relatedEntityType === "PROJECT_JOIN_REQUEST";
              const project = isJoinRequest
                ? projectsById[n.relatedEntityId || ""]
                : null;
              const isChef = Boolean(
                project && project.chefDeProjet === userEmail,
              );
              return (
                <div
                  key={n.id}
                  className={cn(
                    "bg-card rounded-xl border p-4 flex items-start gap-4",
                    !n.lu && "border-primary/30 bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      typeColors[n.type],
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{n.titre}</p>
                      {!n.lu && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.date).toLocaleDateString("fr-FR")}
                    </p>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(n.id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(n.id)}
                    >
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
