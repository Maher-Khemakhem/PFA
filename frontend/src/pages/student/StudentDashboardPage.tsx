import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMyProjects,
  fetchTasks,
  fetchEvents,
  fetchRecommendations,
} from "@/lib/api";
import { Project, Task, Event, Recommendation } from "@/lib/types";
import {
  FolderKanban,
  ListTodo,
  CalendarDays,
  Lightbulb,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/SmartImage";
import { eventPhoto, imageCandidates, projectPhoto } from "@/lib/images";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

const dayMs = 24 * 60 * 60 * 1000;

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setTime(d.getTime() - day * dayMs);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatWeekLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function StudentDashboardPage() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects", "mine"],
    queryFn: fetchMyProjects,
  });
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks", "mine"],
    queryFn: fetchTasks,
  });
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });
  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  const myProjects = projects;
  const myTasks = tasks;

  const projectProgressData = myProjects
    .slice()
    .sort((a, b) => b.progression - a.progression)
    .slice(0, 5)
    .map((project) => ({
      name: project.titre.length > 18 ? `${project.titre.slice(0, 18)}…` : project.titre,
      progression: project.progression,
      taches: project.taches?.length ?? 0,
    }));

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weeks = Array.from({ length: 6 }, (_, index) => addDays(weekStart, index * 7));
  const activityData = weeks.map((start) => ({
    label: formatWeekLabel(start),
    taches: 0,
    evenements: 0,
  }));

  const addToBucket = (dateValue: string | undefined, key: "taches" | "evenements") => {
    if (!dateValue) return;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return;
    if (date < weekStart || date >= addDays(weekStart, weeks.length * 7)) return;
    const diff = Math.floor((startOfWeek(date).getTime() - weekStart.getTime()) / (7 * dayMs));
    if (diff >= 0 && diff < activityData.length) {
      activityData[diff][key] += 1;
    }
  };

  myTasks.forEach((task) => addToBucket(task.deadline, "taches"));
  events.forEach((eventItem) => addToBucket(eventItem.dateHeure, "evenements"));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Dashboard Étudiant</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Mes Projets"
            value={myProjects.length}
            icon={<FolderKanban className="h-5 w-5" />}
            variant="primary"
          />
          <StatCard
            title="Tâches en cours"
            value={myTasks.filter((t) => t.statut === "En cours").length}
            icon={<ListTodo className="h-5 w-5" />}
            variant="warning"
          />
          <StatCard
            title="Événements"
            value={events.length}
            icon={<CalendarDays className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Recommandations"
            value={recommendations.length}
            icon={<Lightbulb className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-5 shadow-card relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-semibold text-lg">
                    Progression des projets
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Top 5 par avancement
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Live
                </span>
              </div>
              {projectProgressData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                  Ajoutez des projets pour voir la progression.
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProgressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          borderRadius: 12,
                          borderColor: "hsl(var(--border))",
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value}%`, "Progression"]}
                      />
                      <Bar dataKey="progression" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-5 shadow-card relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--secondary)/0.18),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-semibold text-lg">
                    Activite a venir
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Taches et evenements par semaine
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary/15 text-secondary-foreground">
                  6 semaines
                </span>
              </div>
              {activityData.every((item) => item.taches === 0 && item.evenements === 0) ? (
                <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                  Aucun planning detecte sur les 6 prochaines semaines.
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        cursor={{ stroke: "hsl(var(--muted-foreground))" }}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          borderRadius: 12,
                          borderColor: "hsl(var(--border))",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="taches"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Taches"
                      />
                      <Line
                        type="monotone"
                        dataKey="evenements"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        name="Evenements"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">Mes Projets</h2>
            <Link to="/projects">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {myProjects.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                    <SmartImage sources={imageCandidates(undefined, projectPhoto(p.id || p.titre))} alt={p.titre} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.titre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={p.statut} />
                      <span className="text-xs text-muted-foreground">
                        {p.progression}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-24 ml-4">
                  <ProgressBar value={p.progression} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks */}
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-display font-semibold text-lg mb-4">
              Tâches assignées
            </h2>
            <div className="space-y-3">
              {myTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{t.titre}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {t.deadline}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={t.statut} />
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">
                Recommandations
              </h2>
              <Link to="/recommendations">
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recommendations.map((r) => {
                const isEvent = r.recommendationType === "EVENT";
                const target = isEvent ? "/events" : `/projects/${r.projetId}`;
                const label = isEvent ? "Événement" : "Projet";

                return (
                  <Link
                    key={r.id}
                    to={target}
                    className="block p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{r.titre}</p>
                      <span className="text-sm font-semibold text-primary">
                        {r.competenceMatch}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {label} · {r.categorie}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">
              Événements à venir
            </h2>
            <Link to="/events">
              <Button variant="ghost" size="sm" className="gap-1">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.slice(0, 2).map((e) => (
              <div key={e.id} className="rounded-lg border bg-muted/20 overflow-hidden">
                <div className="h-28 bg-muted">
                  <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                </div>
                <div className="p-4">
                <h3 className="font-medium">{e.titre}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {e.lieu} · {new Date(e.dateHeure).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {e.placesRestantes} places restantes
                  </span>
                  <Button size="sm" variant="outline">
                    Participer
                  </Button>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
