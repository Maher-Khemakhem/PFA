import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { useQuery } from '@tanstack/react-query';
import { fetchMyProjects, fetchProjects, fetchProjectsByOrganisation, fetchTasks } from '@/lib/api';
import { Project, Task, ProjectMember } from '@/lib/types';
import { BarChart3, Users, ListTodo, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function StatisticsPage() {
  const { userRole, userName } = useAuth();
  const [filter, setFilter] = useState('all');

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects', 'stats', userRole, userName],
    queryFn: () => {
      if (userRole === 'organization') return fetchProjectsByOrganisation(userName);
      if (userRole === 'student') return fetchMyProjects();
      return fetchProjects();
    },
    enabled: userRole !== 'organization' || Boolean(userName),
  });
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', 'stats'],
    queryFn: fetchTasks,
  });

  const members = projects.reduce<ProjectMember[]>((acc, project) => {
    for (const member of project.membres || []) {
      if (!acc.some((m) => m.email === member.email)) {
        acc.push({
          id: member.email,
          userId: member.email,
          nom: member.email,
          email: member.email,
          role: member.role,
        });
      }
    }
    return acc;
  }, []);

  const totalMembers = members.length;
  const avgMembers = projects.length > 0
    ? (projects.reduce((s, p) => s + p.membres.length, 0) / projects.length).toFixed(1)
    : "0";
  const completedTasks = tasks.filter(t => t.statut === 'Terminée').length;

  // Simulate member activity data
  const memberStats = members.map(m => ({
    nom: m.nom,
    tasksCompleted: Math.floor(Math.random() * 10) + 1,
    participation: Math.floor(Math.random() * 40) + 60,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold">Statistiques</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              <SelectItem value="march">Mars 2025</SelectItem>
              <SelectItem value="february">Février 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Participation" value="78%" icon={<Users className="h-5 w-5" />} variant="primary" />
          <StatCard title="Moy. membres/projet" value={avgMembers} icon={<TrendingUp className="h-5 w-5" />} variant="success" />
          <StatCard title="Tâches réalisées" value={completedTasks} icon={<ListTodo className="h-5 w-5" />} variant="warning" />
          <StatCard title="Projets actifs" value={projects.filter(p => p.statut === 'En cours').length} icon={<BarChart3 className="h-5 w-5" />} />
        </div>

        {/* Members Activity */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Membres les plus actifs</h2>
          <div className="space-y-3">
            {memberStats.sort((a, b) => b.tasksCompleted - a.tasksCompleted).map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium">{m.nom}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{m.tasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">tâches</p>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${m.participation}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by member */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-display font-semibold text-lg mb-4">Tâches réalisées par membre</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Membre</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">Terminées</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">En cours</th>
                  <th className="text-center px-4 py-2 text-xs font-medium text-muted-foreground">En retard</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm">{m.nom}</td>
                    <td className="px-4 py-3 text-sm text-center text-success font-medium">{Math.floor(Math.random() * 5) + 1}</td>
                    <td className="px-4 py-3 text-sm text-center text-primary font-medium">{Math.floor(Math.random() * 3)}</td>
                    <td className="px-4 py-3 text-sm text-center text-destructive font-medium">{Math.floor(Math.random() * 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
