import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { useQuery } from '@tanstack/react-query';
import { fetchEventsByOrganizer, fetchProjectsByOrganisation } from '@/lib/api';
import { Project, Event } from '@/lib/types';
import { BarChart3, Users, FolderKanban, CalendarDays, TrendingUp } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useAuth } from '@/lib/auth-context';

export default function OrgStatisticsPage() {
  const { userName, userEmail } = useAuth();
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', 'org', userName],
    queryFn: () => fetchProjectsByOrganisation(userName),
    enabled: Boolean(userName),
  });
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['events', 'org', userEmail],
    queryFn: () => fetchEventsByOrganizer(),
    enabled: Boolean(userEmail),
  });

  const totalMembers = projects.reduce((acc, p) => acc + p.membres.length, 0);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + p.progression, 0) / projects.length)
    : 0;
  const totalParticipants = events.reduce((s, e) => s + (e.nombrePlaces - e.placesRestantes), 0);

  const byStatus = [
    { label: 'Planifié', value: projects.filter(p => p.statut === 'Planifié').length, color: 'bg-muted-foreground' },
    { label: 'En cours', value: projects.filter(p => p.statut === 'En cours').length, color: 'bg-primary' },
    { label: 'Terminé', value: projects.filter(p => p.statut === 'Terminé').length, color: 'bg-success' },
    { label: 'En Retard', value: projects.filter(p => p.statut === 'En Retard').length, color: 'bg-destructive' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Statistiques Organisation</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Projets" value={projects.length} icon={<FolderKanban className="h-5 w-5" />} variant="primary" />
          <StatCard title="Événements" value={events.length} icon={<CalendarDays className="h-5 w-5" />} variant="success" />
          <StatCard title="Participants totaux" value={totalParticipants} icon={<Users className="h-5 w-5" />} variant="warning" />
          <StatCard title="Progression moy." value={`${avgProgress}%`} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        {/* Projets par statut */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Projets par statut</h2>
          <div className="space-y-3">
            {byStatus.map(s => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="text-sm w-24 shrink-0">{s.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: projects.length > 0 ? `${(s.value / projects.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm font-semibold w-6 text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progression des projets */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Progression des projets</h2>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-4">
                <span className="text-sm truncate w-48 shrink-0">{p.titre}</span>
                <ProgressBar value={p.progression} className="flex-1" />
                <span className="text-sm font-semibold w-10 text-right">{p.progression}%</span>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun projet</p>
            )}
          </div>
        </div>

        {/* Événements — taux de remplissage */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Taux de remplissage des événements</h2>
          <div className="space-y-3">
            {events.map(e => {
              const fill = e.nombrePlaces > 0
                ? Math.round(((e.nombrePlaces - e.placesRestantes) / e.nombrePlaces) * 100)
                : 0;
              return (
                <div key={e.id} className="flex items-center gap-4">
                  <span className="text-sm truncate w-48 shrink-0">{e.titre}</span>
                  <ProgressBar value={fill} className="flex-1" />
                  <span className="text-sm font-semibold w-10 text-right">{fill}%</span>
                </div>
              );
            })}
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun événement</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
