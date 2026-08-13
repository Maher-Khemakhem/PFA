import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminOrganizations,
  fetchAdminStudents,
  fetchEvents,
  fetchProjects,
} from '@/lib/api';
import { Event, Project } from '@/lib/types';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  FolderKanban,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-dashboard', 'students'],
    queryFn: fetchAdminStudents,
  });
  const { data: organizations = [], isLoading: loadingOrganizations } = useQuery({
    queryKey: ['admin-dashboard', 'organizations'],
    queryFn: fetchAdminOrganizations,
  });
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['admin-dashboard', 'projects'],
    queryFn: fetchProjects,
  });
  const { data: events = [], isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['admin-dashboard', 'events'],
    queryFn: fetchEvents,
  });

  const isLoading = loadingStudents || loadingOrganizations || loadingProjects || loadingEvents;
  const completedProjects = projects.filter((project) => project.statut === 'Terminé').length;
  const activeProjects = projects.filter((project) => project.statut === 'En cours').length;
  const totalTasks = projects.reduce((sum, project) => sum + (project.taches?.length ?? 0), 0);
  const completedTasks = projects.reduce(
    (sum, project) => sum + (project.taches?.filter((task) => task.statut === 'Terminée').length ?? 0),
    0
  );
  const totalParticipants = events.reduce(
    (sum, event) => sum + Math.max(event.nombrePlaces - event.placesRestantes, 0),
    0
  );
  const upcomingEvents = [...events]
    .filter((event) => new Date(event.dateHeure).getTime() >= Date.now())
    .sort((left, right) => new Date(left.dateHeure).getTime() - new Date(right.dateHeure).getTime());

  const adminPages = [
    {
      title: 'Étudiants',
      description: `${students.length} comptes étudiants`,
      to: '/admin/students',
      icon: GraduationCap,
    },
    {
      title: 'Organisations',
      description: `${organizations.length} espaces organisation`,
      to: '/admin/organizations',
      icon: Building2,
    },
    {
      title: 'Projets',
      description: `${projects.length} projets publiés`,
      to: '/admin/projects',
      icon: FolderKanban,
    },
    {
      title: 'Événements',
      description: `${events.length} événements créés`,
      to: '/admin/events',
      icon: CalendarDays,
    },
    {
      title: 'Statistiques',
      description: 'Vue globale de la plateforme',
      to: '/admin/statistics',
      icon: BarChart3,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-bold">Dashboard Admin</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Synchronisation des données...' : 'Vue dynamique de toute la plateforme'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/students"><Button size="sm" variant="outline">Étudiants</Button></Link>
            <Link to="/admin/organizations"><Button size="sm" variant="outline">Organisations</Button></Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Étudiants" value={students.length} icon={<Users className="h-5 w-5" />} variant="primary" />
          <StatCard title="Organisations" value={organizations.length} icon={<Building2 className="h-5 w-5" />} variant="warning" />
          <StatCard title="Projets" value={projects.length} subtitle={`${activeProjects} en cours`} icon={<FolderKanban className="h-5 w-5" />} variant="success" />
          <StatCard title="Événements" value={events.length} subtitle={`${totalParticipants} participations`} icon={<CalendarDays className="h-5 w-5" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {adminPages.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="bg-card rounded-xl border p-4 hover:shadow-elevated transition-shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <page.icon className="h-5 w-5 text-primary" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-semibold text-sm mt-4">{page.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{page.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Projets récents</h2>
              <Link to="/admin/projects">
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{project.titre}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.chefDeProjetNom || project.chefDeProjet}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={project.statut} />
                    <div className="w-20"><ProgressBar value={project.progression} /></div>
                  </div>
                </Link>
              ))}
              {!isLoading && projects.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun projet pour le moment</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Événements à venir</h2>
              <Link to="/admin/events">
                <Button variant="ghost" size="sm" className="gap-1">
                  Voir tout <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-sm truncate">{event.titre}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(event.dateHeure).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.lieu} · {event.nombrePlaces - event.placesRestantes}/{event.nombrePlaces} participants
                  </p>
                </div>
              ))}
              {!isLoading && upcomingEvents.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun événement à venir</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{completedProjects}</p>
            <p className="text-xs text-muted-foreground mt-1">Projets terminés</p>
          </div>
          <div className="bg-card rounded-xl border p-4 text-center">
            <p className="text-2xl font-display font-bold text-success">{completedTasks}</p>
            <p className="text-xs text-muted-foreground mt-1">Tâches réalisées / {totalTasks}</p>
          </div>
          <div className="bg-card rounded-xl border p-4 text-center">
            <p className="text-2xl font-display font-bold text-secondary">
              {organizations.filter((org) => org.organizationType).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Organisations catégorisées</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
