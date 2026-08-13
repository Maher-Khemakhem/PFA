import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addProjectMember,
  addTask,
  createNotification,
  removeProjectMember,
  fetchProject,
  fetchTasks,
  replaceTaskMembers,
  updateTask,
  updateProject,
} from "@/lib/api";
import { Project, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { SmartImage } from "@/components/SmartImage";
import { avatarPhoto, imageCandidates, projectPhoto } from "@/lib/images";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { userRole, userEmail } = useAuth();
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskMembers, setTaskMembers] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priorite"]>("Medium");
  const [taskView, setTaskView] = useState<"cards" | "calendar">("cards");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [hiddenTaskIds, setHiddenTaskIds] = useState<Set<string>>(new Set());
  const [showHiddenTasks, setShowHiddenTasks] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const joinRequestStorageKey = id && userEmail ? `join-request:${id}:${userEmail}` : "";
  const [joinRequestSent, setJoinRequestSent] = useState(
    () => Boolean(joinRequestStorageKey && localStorage.getItem(joinRequestStorageKey)),
  );
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: ["projects", "details", id],
    queryFn: () => fetchProject(id ?? ""),
    enabled: Boolean(id),
  });
  const { data: tasksData = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const userTasks = tasksData.filter((t) => t.projectId === project?.id);
  const tasks =
    userRole === "organization" || userRole === "admin"
      ? (project?.taches ?? [])
      : userTasks.length > 0
        ? userTasks
        : (project?.taches ?? []);

  useEffect(() => {
    if (!project?.id) return;
    const stored = localStorage.getItem(`project-hidden-tasks:${project.id}`);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      setHiddenTaskIds(new Set(parsed));
    } catch {
      setHiddenTaskIds(new Set());
    }
  }, [project?.id]);

  useEffect(() => {
    if (!project?.id) return;
    const ids = Array.from(hiddenTaskIds);
    localStorage.setItem(`project-hidden-tasks:${project.id}`, JSON.stringify(ids));
  }, [hiddenTaskIds, project?.id]);

  const parseDeadline = (deadline?: string) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getDeadlineAlert = (deadline?: string) => {
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
  };

  const isTaskCompleted = (task: Task) =>
    task.statut === "Terminée" || (task.progression ?? 0) >= 100;

  const statusOrder: Record<Task["statut"], number> = {
    "Non commencée": 0,
    "En cours": 1,
    "Terminée": 2,
    "En retard": 1,
  };

  const getTaskColumnStatus = (task: Task) => {
    if (isTaskCompleted(task)) return "Terminée" as const;
    const alert = getDeadlineAlert(task.deadline);
    if (alert?.label === "En retard") return "En retard" as const;
    return task.statut;
  };

  const visibleTasks = useMemo(
    () => (showHiddenTasks ? tasks : tasks.filter((t) => !hiddenTaskIds.has(t.id))),
    [showHiddenTasks, tasks, hiddenTaskIds],
  );

  const addTaskMutation = useMutation({
    mutationFn: (payload: {
      projetId: string;
      titre: string;
      description: string;
      echeance?: string;
      priorite?: Task["priorite"];
      membresEmails: string[];
    }) =>
      addTask(payload.projetId, {
        titre: payload.titre,
        description: payload.description,
        echeance: payload.echeance,
        priorite: payload.priorite,
        membresEmails: payload.membresEmails,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "details", id] });
      toast.success("Tache ajoutee");
      setTaskTitle("");
      setTaskDescription("");
      setTaskDeadline("");
      setTaskMembers("");
      setTaskPriority("Medium");
      setAddOpen(false);
    },
    onError: () => toast.error("Impossible d'ajouter la tache"),
  });

  const assignMutation = useMutation({
    mutationFn: ({
      projetId,
      tacheId,
      emails,
    }: {
      projetId: string;
      tacheId: string;
      emails: string[];
    }) => replaceTaskMembers(projetId, tacheId, emails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Membres assignes");
    },
    onError: () => toast.error("Impossible d'assigner les membres"),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ task, nextStatus, nextProgress }: { task: Task; nextStatus: Task["statut"]; nextProgress: number }) =>
      updateTask(task.projectId, task.id, {
        titre: task.titre,
        description: task.description,
        status:
          nextStatus === "Terminée"
            ? "TERMINE"
            : nextStatus === "En cours"
              ? "EN_COURS"
              : "EN_ATTENTE",
        echeance: task.deadline || undefined,
        progression: nextProgress,
        commentaire: task.commentaire ?? "",
        updatedByEmail: userEmail || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "details", id] });
      toast.success("Statut mis a jour");
    },
    onError: () => toast.error("Impossible de modifier le statut"),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ projetId, email }: { projetId: string; email: string }) =>
      addProjectMember(projetId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "details", id],
      });
      if (project?.id) {
        createNotification({
          userId: variables.email,
          titre: "Ajoute a un projet",
          message: `Vous avez ete ajoute au projet "${project.titre}".`,
          type: "INFO",
          relatedEntityType: "PROJECT",
          relatedEntityId: project.id,
        }).catch(() => {
          // notification failure should not block member addition
        });
      }
      toast.success("Membre ajoute");
      setMemberEmail("");
      setMemberOpen(false);
    },
    onError: () => toast.error("Impossible d'ajouter le membre"),
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: (nextVisibility: Project["visibilite"]) =>
      updateProject(project.id, {
        titre: project.titre,
        desc: project.description,
        deadline: project.dateFin,
        chefProjet: project.chefDeProjet,
        organisation: project.categorie,
        visibilite: nextVisibility,
        membres: project.membres.map((m) => m.email),
        ressources: project.ressources.map((r) => ({ nom: r.nom, valeur: r.lien })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", "details", id] });
      queryClient.invalidateQueries({ queryKey: ["projects", "list"] });
      toast.success("Visibilite mise a jour");
    },
    onError: () => toast.error("Impossible de modifier la visibilite"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ projetId, email }: { projetId: string; email: string }) =>
      removeProjectMember(projetId, email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", "details", id],
      });
      if (project?.id) {
        createNotification({
          userId: variables.email,
          titre: "Retire d'un projet",
          message: `Vous avez ete retire du projet "${project.titre}".`,
          type: "WARNING",
          relatedEntityType: "PROJECT",
          relatedEntityId: project.id,
        }).catch(() => {
          // notification failure should not block member removal
        });
      }
      toast.success("Membre supprime");
    },
    onError: () => toast.error("Impossible de supprimer le membre"),
  });

  const joinRequestMutation = useMutation({
    mutationFn: async () => {
      if (!project?.id || !userEmail) {
        throw new Error("Missing project or user email");
      }

      const recipients = Array.from(
        new Set([project.chefDeProjet, project.categorie].filter(Boolean)),
      ).filter((recipient) => recipient.toLowerCase() !== userEmail.toLowerCase());

      if (recipients.length === 0) {
        throw new Error("No recipient for join request");
      }

      await Promise.all(
        recipients.map((recipient) =>
          createNotification({
            userId: recipient,
            titre: "Demande pour rejoindre un projet",
            message: `${userEmail} souhaite rejoindre le projet "${project.titre}". Approuvez cette demande pour l'ajouter comme membre.`,
            type: "INFO",
            relatedEntityType: "PROJECT_JOIN_REQUEST",
            relatedEntityId: project.id,
          }),
        ),
      );
    },
    onSuccess: () => {
      if (joinRequestStorageKey) {
        localStorage.setItem(joinRequestStorageKey, "sent");
      }
      setJoinRequestSent(true);
      toast.success("Demande envoyee");
    },
    onError: () => {
      toast.error("Impossible d'envoyer la demande");
    },
  });

  if (isLoadingProject)
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Chargement du projet...
        </div>
      </DashboardLayout>
    );
  if (!project)
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-destructive">
          Projet non trouvé
        </div>
      </DashboardLayout>
    );

  const isLate = project.statut === "En Retard";
  const deadlineDate = project.dateFin ? new Date(project.dateFin) : null;
  const daysLeft =
    deadlineDate && !Number.isNaN(deadlineDate.getTime())
      ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
  const canManageProject = userRole === "organization" || userRole === "admin";
  const normalizedUserEmail = userEmail.toLowerCase();
  const isProjectMember =
    normalizedUserEmail.length > 0 &&
    (project.chefDeProjet.toLowerCase() === normalizedUserEmail ||
      project.membres.some((member) => member.email.toLowerCase() === normalizedUserEmail));
  const isChef = project.chefDeProjet.toLowerCase() === normalizedUserEmail;
  const canContribute = canManageProject || isProjectMember;
  const canRequestToJoin =
    userRole === "student" &&
    !isProjectMember &&
    project.visibilite === "PUBLIC" &&
    Boolean(userEmail) &&
    !joinRequestSent;
  const historyItems = [
    {
      date: project.dateFin || "Aujourd'hui",
      action: `Progression mise a jour a ${project.progression}%`,
    },
    {
      date: project.dateDebut || "Aujourd'hui",
      action: `Projet ${project.visibilite === "PRIVE" ? "prive" : "public"} cree`,
    },
  ];

  const handleAddTask = () => {
    if (!project?.id) return;
    if (!taskTitle.trim() || !taskDescription.trim()) {
      toast.error("Titre et description requis");
      return;
    }
    const emails = taskMembers
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (userRole === "student" && userEmail && !emails.includes(userEmail)) {
      emails.push(userEmail);
    }
    addTaskMutation.mutate({
      projetId: project.id,
      titre: taskTitle.trim(),
      description: taskDescription.trim(),
      echeance: taskDeadline || undefined,
      priorite: taskPriority,
      membresEmails: emails,
    });
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

  const handleDrop = (targetStatus: Task["statut"] | undefined, event: React.DragEvent) => {
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
    const currentProgress = task.progression ?? 0;
    const nextProgress =
      targetStatus === "Terminée"
        ? 100
        : targetStatus === "En cours"
          ? Math.max(currentProgress, 5)
          : currentProgress;
    updateTaskMutation.mutate({ task, nextStatus: targetStatus, nextProgress });
  };

  const handleAddMember = () => {
    if (!project?.id) return;
    const email = memberEmail.trim();
    if (!email) {
      toast.error("Email requis");
      return;
    }
    addMemberMutation.mutate({ projetId: project.id, email });
  };

  const handleRemoveMember = (email: string) => {
    if (!project?.id) return;
    if (!email) {
      toast.error("Email requis");
      return;
    }
    removeMemberMutation.mutate({ projetId: project.id, email });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="h-56 overflow-hidden rounded-xl border bg-muted">
          <SmartImage sources={imageCandidates(undefined, projectPhoto(project.id || project.titre))} alt={project.titre} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link
              to="/projects"
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              ← Retour aux projets
            </Link>
            <h1 className="font-display text-2xl font-bold">{project.titre}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={project.statut} />
              <span className="text-sm text-muted-foreground">
                {project.categorie}
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                {project.visibilite === "PRIVE" ? "Prive" : "Public"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canRequestToJoin && (
              <Button
                className="gap-2"
                onClick={() => joinRequestMutation.mutate()}
                disabled={joinRequestMutation.isPending}
              >
                <UserPlus className="h-4 w-4" />
                {joinRequestMutation.isPending ? "Envoi..." : "Demander a rejoindre"}
              </Button>
            )}
            {userRole === "student" && !isProjectMember && project.visibilite === "PUBLIC" && joinRequestSent && (
              <Button variant="outline" className="gap-2" disabled>
                <UserPlus className="h-4 w-4" />
                Demande envoyee
              </Button>
            )}
            {isChef && (
              <Select
                value={project.visibilite}
                onValueChange={(value) => updateVisibilityMutation.mutate(value as Project["visibilite"])}
                disabled={updateVisibilityMutation.isPending}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="PRIVE">Prive</SelectItem>
                </SelectContent>
              </Select>
            )}
            {canManageProject && <Button variant="outline">Modifier</Button>}
          </div>
        </div>

        {/* Deadline Alert */}
        {(isLate || (daysLeft !== null && daysLeft <= 7 && daysLeft > 0)) && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${isLate ? "bg-destructive/10 border border-destructive/20" : "bg-warning/10 border border-warning/20"}`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${isLate ? "text-destructive" : "text-warning"}`}
            />
            <span className="text-sm font-medium">
              {isLate
                ? "Ce projet est en retard !"
                : `Deadline dans ${daysLeft} jours`}
            </span>
          </div>
        )}

        {/* Progress */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-lg font-display font-bold">
              {project.progression}%
            </span>
          </div>
          <ProgressBar value={project.progression} size="md" />
        </div>

        <Tabs defaultValue="apercu">
          <TabsList>
            <TabsTrigger value="apercu">Aperçu</TabsTrigger>
            <TabsTrigger value="taches">Tâches ({tasks.length})</TabsTrigger>
            <TabsTrigger value="membres">
              Membres ({project.membres.length})
            </TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="apercu" className="space-y-4 mt-4">
            <div className="bg-card rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h3>
                <p className="text-sm">{project.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Chef: <strong>{project.chefDeProjetNom}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {project.dateDebut} → {project.dateFin}
                  </span>
                </div>
              </div>
              {project.ressources.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Ressources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.ressources.map((r, i) => (
                      <a
                        key={i}
                        href={r.lien}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/80"
                      >
                        <FileText className="h-3.5 w-3.5" /> {r.nom}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="taches" className="mt-4">
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-medium">Tâches</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={taskView === "cards" ? "default" : "outline"}
                    className={taskView === "cards" ? "gradient-primary border-0 text-primary-foreground" : ""}
                    onClick={() => setTaskView("cards")}
                  >
                    Cartes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={taskView === "calendar" ? "default" : "outline"}
                    className={taskView === "calendar" ? "gradient-primary border-0 text-primary-foreground" : ""}
                    onClick={() => setTaskView("calendar")}
                  >
                    Calendrier
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={showHiddenTasks ? "default" : "outline"}
                    onClick={() => setShowHiddenTasks((prev) => !prev)}
                  >
                    {showHiddenTasks ? "Masquées" : "Afficher masquées"}
                  </Button>
                  <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    {canContribute && (
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                          <Plus className="h-3.5 w-3.5" /> Ajouter une tâche
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter une tâche</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="Titre de la tache"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder="Description de la tache"
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Deadline</Label>
                          <Input
                            type="date"
                            value={taskDeadline}
                            onChange={(e) => setTaskDeadline(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priorite</Label>
                          <Select
                            value={taskPriority}
                            onValueChange={(value) =>
                              setTaskPriority(value as Task["priorite"])
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir une priorite" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Membres (emails separes par des virgules)</Label>
                          <Input
                            value={taskMembers}
                            onChange={(e) => setTaskMembers(e.target.value)}
                            placeholder="m1@exemple.com, m2@exemple.com"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setAddOpen(false)}
                          >
                            Annuler
                          </Button>
                          <Button
                            onClick={handleAddTask}
                            disabled={addTaskMutation.isPending}
                          >
                            Ajouter
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {taskView === "cards" && (
                <div className="p-4">
                  <div className="grid gap-4 lg:grid-cols-4">
                    {[
                      { key: "todo", title: "Non commencée", status: "Non commencée", droppable: "Non commencée" },
                      { key: "doing", title: "En cours", status: "En cours", droppable: "En cours" },
                      { key: "done", title: "Terminée", status: "Terminée", droppable: "Terminée" },
                      { key: "late", title: "En retard", status: "En retard" },
                    ].map((column) => {
                      const columnTasks = visibleTasks.filter((t) => getTaskColumnStatus(t) === column.status);
                      return (
                        <div
                          key={column.key}
                          className={`rounded-xl border bg-muted/20 p-3 transition-colors ${
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
                          onDrop={(event) => handleDrop(column.droppable as Task["statut"], event)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold">{column.title}</h4>
                            <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                          </div>
                          <div className="space-y-3">
                            {columnTasks.map((t) => (
                              <div
                                key={t.id}
                                draggable={!isTaskCompleted(t)}
                                onDragStart={(event) => handleDragStart(t, event)}
                                onDragEnd={handleDragEnd}
                                className={`rounded-lg border bg-card p-3 space-y-2 transition-all duration-150 ease-out will-change-transform ${
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
                                  <div>
                                    <p className="text-sm font-medium">{t.titre}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {t.description}
                                    </p>
                                  </div>
                                  <PriorityBadge priority={t.priorite} />
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Select
                                      value={t.assigneA || ""}
                                      onValueChange={(value) =>
                                        assignMutation.mutate({
                                          projetId: t.projectId,
                                          tacheId: t.id,
                                          emails: value ? [value] : [],
                                        })
                                      }
                                    >
                                      <SelectTrigger
                                        className="h-6 w-6 rounded-full border bg-muted p-0 pr-0 shadow-none [&>svg]:hidden"
                                        onClick={(event) => event.stopPropagation()}
                                        disabled={!canContribute}
                                      >
                                        {t.assigneA ? (
                                          <SmartImage
                                            sources={imageCandidates("", avatarPhoto(t.assigneA))}
                                            alt={t.assigneA}
                                            className="h-6 w-6 rounded-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-[10px] font-semibold text-muted-foreground">
                                            {t.assigneNom || t.assigneA ? "" : "?"}
                                          </span>
                                        )}
                                      </SelectTrigger>
                                      <SelectContent onClick={(event) => event.stopPropagation()}>
                                        {project.membres.length === 0 && (
                                          <div className="px-2 py-1 text-xs text-muted-foreground">
                                            Aucun membre
                                          </div>
                                        )}
                                        {project.membres.map((member) => (
                                          <SelectItem key={member.email} value={member.email}>
                                            {member.email}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <span className="truncate">
                                      {t.assigneNom || t.assigneA || "Non assignée"}
                                    </span>
                                  </div>
                                  <span>{t.deadline || "-"}</span>
                                </div>
                                {getDeadlineAlert(t.deadline) && (
                                  <div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getDeadlineAlert(t.deadline)!.className}`}
                                    >
                                      {getDeadlineAlert(t.deadline)!.label}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <ProgressBar value={t.progression ?? 0} className="w-20" />
                                  <span className="text-xs text-muted-foreground">{t.progression ?? 0}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <StatusBadge status={t.statut} />
                                  {isTaskCompleted(t) && !hiddenTaskIds.has(t.id) && (
                                    <button
                                      type="button"
                                      aria-label="Marquer comme done"
                                      title="Marquer comme done"
                                      className="text-success hover:text-success/80"
                                      onClick={() =>
                                        setHiddenTaskIds((prev) =>
                                          new Set([...Array.from(prev), t.id]),
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {columnTasks.length === 0 && (
                              <div className="text-xs text-muted-foreground">Aucune tâche</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {taskView === "calendar" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCalendarMonth(
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
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
                          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
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
                        const dayTasks = visibleTasks.filter((task) => {
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
                            <div className="text-[11px] text-muted-foreground">{day}</div>
                            <div className="space-y-1 overflow-auto">
                              {dayTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="rounded-md bg-background/70 border px-2 py-1 text-[11px]"
                                >
                                  <span className="font-medium">{task.titre}</span>
                                  <span className="block text-[10px] text-muted-foreground">
                                    {task.assigneNom || task.assigneA || "Non assignée"}
                                  </span>
                                </div>
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
          </TabsContent>

          <TabsContent value="membres" className="mt-4">
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">Membres</h3>
                <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
                  {canManageProject && (
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="h-3.5 w-3.5" /> Ajouter un membre
                      </Button>
                    </DialogTrigger>
                  )}
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un membre</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="membre@exemple.com"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setMemberOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={handleAddMember}
                          disabled={addMemberMutation.isPending}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="divide-y">
                {project.membres.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <SmartImage
                          sources={imageCandidates(m.avatar, avatarPhoto(m.email))}
                          alt={m.nom || m.email}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.nom}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.role} />
                      {(userRole === "organization" ||
                        userRole === "admin") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveMember(m.email)}
                          disabled={removeMemberMutation.isPending}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historique" className="mt-4">
            <div className="bg-card rounded-xl border p-5">
              <div className="space-y-4">
                {historyItems.concat([
                  { date: "2025-03-15", action: 'Statut changé à "En cours"' },
                  {
                    date: "2025-03-10",
                    action: 'Tâche "Backend API" assignée à Sara',
                  },
                  {
                    date: "2025-03-05",
                    action: "Membre Ines ajoutée comme Observateur",
                  },
                  { date: "2025-02-28", action: "Projet créé" },
                ]).map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm">{h.action}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {h.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
