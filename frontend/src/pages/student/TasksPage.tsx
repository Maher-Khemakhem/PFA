import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTaskComment,
  fetchProjectMembers,
  fetchTasks,
  replaceTaskMembers,
  updateTask,
} from "@/lib/api";
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/ProgressBar";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { SmartImage } from "@/components/SmartImage";
import { avatarPhoto, imageCandidates } from "@/lib/images";

function getDeadlineAlert(deadline?: string) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDeadline = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.ceil(
    (startOfDeadline.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return {
      label: "En retard",
      className:
        "bg-destructive/10 text-destructive border border-destructive/20",
    };
  }
  if (diffDays === 0) {
    return {
      label: "Aujourd'hui",
      className: "bg-warning/10 text-warning border border-warning/20",
    };
  }
  if (diffDays <= 3) {
    return {
      label: `Dans ${diffDays}j`,
      className: "bg-warning/10 text-warning border border-warning/20",
    };
  }
  return null;
}

function getMinProgress(task: Task): number {
  if (Number.isFinite(task.progression)) return task.progression;
  if (task.statut === "Terminée") return 100;
  return 0;
}

function isTaskCompleted(task: Task): boolean {
  return task.statut === "Terminée" || (task.progression ?? 0) >= 100;
}

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getShortId(id: string): string {
  return id.length > 6 ? id.slice(0, 6).toUpperCase() : id.toUpperCase();
}

function parseDeadline(deadline?: string): Date | null {
  if (!deadline) return null;
  const date = new Date(deadline);
  return Number.isNaN(date.getTime()) ? null : date;
}

type BoardColumn = {
  key: string;
  title: string;
  filter: (task: Task) => boolean;
  droppableStatus?: Task["statut"];
};

const columnTemplates: Array<{
  key: string;
  title: string;
  filter: (task: Task) => boolean;
  droppableStatus?: Task["statut"];
}> = [
  {
    key: "status-todo",
    title: "Non commencée",
    filter: (task) => task.statut === "Non commencée",
    droppableStatus: "Non commencée",
  },
  {
    key: "status-doing",
    title: "En cours",
    filter: (task) => task.statut === "En cours",
    droppableStatus: "En cours",
  },
  {
    key: "status-done",
    title: "Terminée",
    filter: (task) => task.statut === "Terminée",
    droppableStatus: "Terminée",
  },
  {
    key: "status-late",
    title: "En retard",
    filter: (task) => getDeadlineAlert(task.deadline)?.label === "En retard",
  },
  {
    key: "priority-high",
    title: "Priorite High",
    filter: (task) => task.priorite === "High",
  },
  {
    key: "priority-medium",
    title: "Priorite Medium",
    filter: (task) => task.priorite === "Medium",
  },
  {
    key: "priority-low",
    title: "Priorite Low",
    filter: (task) => task.priorite === "Low",
  },
];

const statusOrder: Record<Task["statut"], number> = {
  "Non commencée": 0,
  "En cours": 1,
  Terminée: 2,
  "En retard": 1,
};

export default function TasksPage() {
  const { userEmail, userName } = useAuth();
  const [view, setView] = useState<"board" | "calendar">("board");
  const [updates, setUpdates] = useState<
    Record<string, { note: string; percent: number }>
  >({});
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [columns, setColumns] = useState<BoardColumn[]>([
    columnTemplates[0],
    columnTemplates[1],
    columnTemplates[2],
  ]);
  const [newColumnKey, setNewColumnKey] = useState(columnTemplates[3].key);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const projectIds = Array.from(new Set(tasks.map((task) => task.projectId).filter(Boolean)));

  const { data: projectMembers = {} } = useQuery<Record<string, string[]>>({
    queryKey: ["task-members", projectIds],
    queryFn: async () => {
      const entries = await Promise.all(
        projectIds.map(async (projectId) => {
          const members = await fetchProjectMembers(projectId);
          return [projectId, members] as const;
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: projectIds.length > 0,
  });

  const tasksByStatus = columns.map((col) => ({
    ...col,
    items: tasks.filter((t) => col.filter(t)),
  }));

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const selectedNote = selectedTask
    ? (updates[selectedTask.id]?.note ?? selectedTask.commentaire ?? "")
    : "";
  const selectedPercent = selectedTask
    ? (updates[selectedTask.id]?.percent ?? getMinProgress(selectedTask))
    : 0;

  const updateMutation = useMutation({
    mutationFn: ({
      task,
      note,
      percent,
    }: {
      task: Task;
      note: string;
      percent: number;
    }) =>
      updateTask(task.projectId, task.id, {
        titre: task.titre,
        description: task.description,
        status:
          percent >= 100 ? "TERMINE" : percent > 0 ? "EN_COURS" : "EN_ATTENTE",
        echeance: task.deadline || undefined,
        progression: percent,
        commentaire: note,
        updatedByEmail: userEmail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "details"] });
      toast.success("Mise à jour enregistrée");
    },
    onError: () => toast.error("Impossible d'enregistrer la mise à jour"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ task, assignee }: { task: Task; assignee: string }) =>
      replaceTaskMembers(task.projectId, task.id, [assignee]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "details"] });
      toast.success("Tache assignee");
    },
    onError: () => toast.error("Impossible d'assigner la tache"),
  });

  const commentMutation = useMutation({
    mutationFn: ({ task, message }: { task: Task; message: string }) =>
      addTaskComment(task.projectId, task.id, {
        authorName: userName || userEmail || "Utilisateur",
        authorEmail: userEmail || "",
        message,
      }),
    onSuccess: (_, { task }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "details"] });
      setCommentDrafts((prev) => ({ ...prev, [task.id]: "" }));
      toast.success("Commentaire ajoute");
    },
    onError: () => toast.error("Impossible d'ajouter le commentaire"),
  });

  useEffect(() => {
    if (!tasks.length) {
      return;
    }

    setUpdates((prev) => {
      const next = { ...prev };
      tasks.forEach((task) => {
        if (!next[task.id]) {
          const initialPercent = Number.isFinite(task.progression)
            ? task.progression
            : task.statut === "Terminée"
              ? 100
              : task.statut === "En cours"
                ? 50
                : 0;
          next[task.id] = {
            note: task.commentaire ?? "",
            percent: initialPercent,
          };
        }
      });
      return next;
    });
  }, [tasks]);

  const handleNoteChange = (taskId: string, note: string) => {
    setUpdates((prev) => ({
      ...prev,
      [taskId]: {
        note,
        percent: prev[taskId]?.percent ?? 0,
      },
    }));
  };

  const handlePercentChange = (taskId: string, percent: number) => {
    setUpdates((prev) => ({
      ...prev,
      [taskId]: {
        note: prev[taskId]?.note ?? "",
        percent,
      },
    }));
  };

  const handleAssign = (task: Task, assignee: string) => {
    if (isTaskCompleted(task)) {
      toast.error("Tache terminee — assignment verrouille");
      return;
    }
    if (!assignee) return;
    assignMutation.mutate({ task, assignee });
  };

  const handleAddComment = (task: Task) => {
    const message = commentDrafts[task.id]?.trim() || "";
    if (!message) {
      toast.error("Le commentaire ne peut pas etre vide");
      return;
    }
    if (!userEmail) {
      toast.error("Veuillez vous connecter");
      return;
    }
    commentMutation.mutate({ task, message });
  };

  const handleDragStart = (task: Task, event: React.DragEvent) => {
    if (isTaskCompleted(task)) {
      event.preventDefault();
      return;
    }
    setDragTaskId(task.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDragOverColumn(null);
  };

  const handleDrop = (
    targetStatus: Task["statut"] | undefined,
    event: React.DragEvent,
  ) => {
    event.preventDefault();
    if (!targetStatus) return;
    const taskId = event.dataTransfer.getData("text/plain") || dragTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (isTaskCompleted(task)) {
      toast.error("Tache terminee — deplacement interdit");
      return;
    }

    const currentOrder = statusOrder[task.statut];
    const targetOrder = statusOrder[targetStatus];
    if (targetOrder < currentOrder) {
      toast.error("Impossible de revenir en arriere");
      return;
    }
    if (targetOrder === currentOrder) return;

    const currentPercent = updates[task.id]?.percent ?? getMinProgress(task);
    const nextPercent =
      targetStatus === "Terminée"
        ? 100
        : targetStatus === "En cours"
          ? Math.max(currentPercent, 5)
          : currentPercent;

    updateMutation.mutate({
      task,
      note: updates[task.id]?.note ?? "",
      percent: Math.max(nextPercent, getMinProgress(task)),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold">Mes Tâches</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "board" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("board")}
            >
              Board
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("calendar")}
            >
              Calendrier
            </Button>
          </div>
        </div>

        {view === "board" && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={newColumnKey} onValueChange={setNewColumnKey}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Ajouter une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnTemplates.map((template) => (
                      <SelectItem key={template.key} value={template.key}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const template = columnTemplates.find(
                      (t) => t.key === newColumnKey,
                    );
                    if (!template) return;
                    if (columns.some((col) => col.key === template.key)) {
                      toast.error("Colonne deja ajoutee");
                      return;
                    }
                    setColumns((prev) => [...prev, template]);
                  }}
                >
                  Ajouter colonne
                </Button>
                <span className="text-sm text-muted-foreground">
                  Glisser-deposer pour changer le statut
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <div className="col-span-full text-center p-8 text-muted-foreground">
                    Chargement des tâches...
                  </div>
                ) : (
                  tasksByStatus.map((column) => (
                    <div
                      key={column.key}
                      className={`rounded-xl border bg-card/40 transition-colors ${
                        dragOverColumn === column.key
                          ? "ring-2 ring-primary/30 bg-primary/5"
                          : ""
                      }`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDragOverColumn(column.key);
                      }}
                      onDragLeave={() => setDragOverColumn(null)}
                      onDrop={(event) =>
                        handleDrop(column.droppableStatus, event)
                      }
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                        <h2 className="text-xs font-semibold uppercase tracking-wide">
                          {column.title}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          {column.items.length}
                        </span>
                      </div>
                      <div className="p-2 space-y-2 min-h-[120px]">
                        {column.items.length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-6">
                            Aucune tache
                          </div>
                        )}
                        {column.items.map((t) => {
                          const taskMembers = projectMembers[t.projectId] || [];
                          return (
                          <div
                            key={t.id}
                            draggable={!isTaskCompleted(t)}
                            onDragStart={(event) => handleDragStart(t, event)}
                            onDragEnd={handleDragEnd}
                            onClick={() => setSelectedTaskId(t.id)}
                            className={`bg-card rounded-md border px-3 py-2 shadow-sm transition-all duration-150 ease-out will-change-transform ${
                              dragTaskId === t.id
                                ? "opacity-60 scale-[0.98]"
                                : "hover:shadow-elevated"
                            } ${
                              isTaskCompleted(t)
                                ? "cursor-not-allowed"
                                : "cursor-grab active:cursor-grabbing"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                  TK-{getShortId(t.id)}
                                </div>
                                <h3 className="font-medium text-sm leading-5 truncate">
                                  {t.titre}
                                </h3>
                              </div>
                              <PriorityBadge priority={t.priorite} />
                            </div>
                            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-2 min-w-0">
                                <Select
                                  value={t.assigneA || ""}
                                  onValueChange={(value) => handleAssign(t, value)}
                                >
                                  <SelectTrigger
                                    className="h-6 w-6 rounded-full border bg-muted p-0 pr-0 shadow-none [&>svg]:hidden"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    {t.assigneA ? (
                                      <SmartImage
                                        sources={imageCandidates("", avatarPhoto(t.assigneA))}
                                        alt={t.assigneA}
                                        className="h-6 w-6 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[10px] font-semibold text-muted-foreground">
                                        {getInitials(t.assigneNom || t.assigneA || "?")}
                                      </span>
                                    )}
                                  </SelectTrigger>
                                  <SelectContent onClick={(event) => event.stopPropagation()}>
                                    {taskMembers.length === 0 && (
                                      <div className="px-2 py-1 text-xs text-muted-foreground">
                                        Aucun membre
                                      </div>
                                    )}
                                    {taskMembers.map((email) => (
                                      <SelectItem key={email} value={email}>
                                        {email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="truncate">
                                  {t.assigneNom || t.assigneA || "Non assignee"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                {t.deadline || "-"}
                              </div>
                            </div>
                            {getDeadlineAlert(t.deadline) && (
                              <div className="mt-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getDeadlineAlert(t.deadline)!.className}`}
                                >
                                  {getDeadlineAlert(t.deadline)!.label}
                                </span>
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">
                                {updates[t.id]?.percent ?? 0}%
                              </span>
                              <StatusBadge status={t.statut} />
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <aside className="w-full lg:w-[360px] shrink-0">
              <div className="rounded-xl border bg-card p-4 lg:sticky lg:top-24">
                {selectedTask ? (
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        TK-{getShortId(selectedTask.id)}
                      </div>
                      <h2 className="text-lg font-semibold">
                        {selectedTask.titre}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedTask.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={selectedTask.priorite} />
                      <StatusBadge status={selectedTask.statut} />
                      {getDeadlineAlert(selectedTask.deadline) && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getDeadlineAlert(selectedTask.deadline)!.className}`}
                        >
                          {getDeadlineAlert(selectedTask.deadline)!.label}
                        </span>
                      )}
                    </div>

                    <div className="rounded-lg border p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Assigne</span>
                        <span className="font-medium text-foreground">
                          {selectedTask.assigneNom || selectedTask.assigneA}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Deadline</span>
                        <span className="font-medium text-foreground">
                          {selectedTask.deadline || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Progression</span>
                        <span className="font-medium text-foreground">
                          {selectedPercent}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Commentaires
                      </Label>
                      <div className="space-y-2">
                        {selectedTask.comments && selectedTask.comments.length > 0 ? (
                          selectedTask.comments.map((comment) => (
                            <div key={comment.id} className="rounded-lg border bg-muted/20 p-3 text-sm">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>{comment.authorName || comment.authorEmail}</span>
                                <span>
                                  {comment.createdAt
                                    ? new Date(comment.createdAt).toLocaleString("fr-FR")
                                    : ""}
                                </span>
                              </div>
                              <div className="text-foreground">{comment.message}</div>
                            </div>
                          ))
                        ) : selectedTask.commentaire ? (
                          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                            <div className="text-xs text-muted-foreground mb-1">
                              Dernier commentaire
                            </div>
                            <div className="text-foreground">
                              {selectedTask.commentaire}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Aucun commentaire pour le moment.
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          value={commentDrafts[selectedTask.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [selectedTask.id]: event.target.value,
                            }))
                          }
                          placeholder="Ajouter un commentaire..."
                          rows={3}
                          className="text-xs"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => handleAddComment(selectedTask)}
                            disabled={commentMutation.isPending}
                          >
                            {commentMutation.isPending ? "Envoi..." : "Ajouter"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                      {isTaskCompleted(selectedTask) && (
                        <div className="rounded-lg bg-success/10 text-success text-xs px-2 py-1">
                          Tache terminee — progression verrouillee
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Ce que j'ai fait
                        </Label>
                        <Textarea
                          value={updates[selectedTask.id]?.note ?? ""}
                          onChange={(event) =>
                            handleNoteChange(
                              selectedTask.id,
                              event.target.value,
                            )
                          }
                          placeholder="Ex: J'ai avancé sur la maquette et corrigé les bugs de connexion..."
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Label>Avancement</Label>
                          <span className="font-medium text-foreground">
                            {selectedPercent}%
                          </span>
                        </div>
                        <Slider
                          value={[selectedPercent]}
                          onValueChange={(value) =>
                            handlePercentChange(
                              selectedTask.id,
                              Math.max(
                                value[0] ?? 0,
                                getMinProgress(selectedTask),
                              ),
                            )
                          }
                          min={getMinProgress(selectedTask)}
                          max={100}
                          step={5}
                          disabled={isTaskCompleted(selectedTask)}
                        />
                        <ProgressBar value={selectedPercent} />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            updateMutation.mutate({
                              task: selectedTask,
                              note: updates[selectedTask.id]?.note ?? "",
                              percent: Math.max(
                                selectedPercent,
                                getMinProgress(selectedTask),
                              ),
                            })
                          }
                          disabled={
                            updateMutation.isPending ||
                            isTaskCompleted(selectedTask)
                          }
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Cliquez sur une tache pour voir les details.
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {view === "calendar" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCalendarMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
              >
                Mois precedent
              </Button>
              <div className="text-sm font-medium">
                {calendarMonth.toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCalendarMonth(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
              >
                Mois suivant
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div key={day} className="text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {(() => {
                const start = new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth(),
                  1,
                );
                const end = new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth() + 1,
                  0,
                );
                const startDay = (start.getDay() + 6) % 7;
                const totalDays = end.getDate();
                const cells = [] as React.ReactNode[];
                for (let i = 0; i < startDay; i += 1) {
                  cells.push(
                    <div key={`empty-${i}`} className="h-28 rounded-lg" />,
                  );
                }
                for (let day = 1; day <= totalDays; day += 1) {
                  const current = new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth(),
                    day,
                  );
                  const dayTasks = tasks.filter((task) => {
                    const deadline = parseDeadline(task.deadline);
                    if (!deadline) return false;
                    return (
                      deadline.getFullYear() === current.getFullYear() &&
                      deadline.getMonth() === current.getMonth() &&
                      deadline.getDate() === current.getDate()
                    );
                  });
                  cells.push(
                    <div
                      key={`day-${day}`}
                      className="h-28 rounded-lg border bg-card/40 p-2 text-xs flex flex-col gap-1"
                    >
                      <div className="text-[11px] text-muted-foreground">
                        {day}
                      </div>
                      <div className="space-y-1 overflow-auto">
                        {dayTasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setView("board");
                            }}
                            className="w-full text-left rounded-md bg-background/70 border px-2 py-1 text-[11px] hover:bg-background"
                          >
                            {task.titre}
                          </button>
                        ))}
                      </div>
                    </div>,
                  );
                }
                return cells;
              })()}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
