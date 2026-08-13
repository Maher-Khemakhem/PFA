import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser, fetchMyProjects } from '@/lib/api';
import { Project, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Mail, GraduationCap, Award, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';

export default function StudentProfilePage() {
  const { userEmail } = useAuth();
  const { data: currentUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  });
  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['projects', 'mine'],
    queryFn: fetchMyProjects,
  });

  if (loadingUser || loadingProjects) {
    return <DashboardLayout><div className="p-8 text-center text-muted-foreground">Chargement du profil...</div></DashboardLayout>;
  }

  const myProjects = projects;
  const asChef = myProjects.filter(p => p.chefDeProjet === userEmail);
  const asMembre = myProjects.filter(p => p.chefDeProjet !== userEmail);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Mon Profil</h1>
          <Link to="/profile/edit">
            <Button variant="outline" size="sm">Modifier le profil</Button>
          </Link>
        </div>

        {/* Profile header */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h2 className="font-display text-xl font-bold">
                {currentUser ? `${currentUser.prenom} ${currentUser.nom}` : userEmail}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" /> {currentUser?.email ?? userEmail}
              </div>
              {currentUser?.faculte && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" /> {currentUser.faculte}
                  {currentUser.specialite && ` — ${currentUser.specialite}`}
                </div>
              )}
              {currentUser?.idUniversitaire && (
                <p className="text-sm text-muted-foreground">ID: {currentUser.idUniversitaire}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total projets', value: myProjects.length, color: 'text-primary' },
            { label: 'Chef de projet', value: asChef.length, color: 'text-secondary' },
            { label: 'Membre', value: asMembre.length, color: 'text-success' },
            { label: 'Compétences', value: currentUser?.competences?.length ?? 0, color: 'text-warning' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Competences */}
        {(currentUser?.competences?.length ?? 0) > 0 && (
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-display font-semibold mb-3">Compétences</h3>
            <div className="flex flex-wrap gap-2">
              {currentUser!.competences!.map(c => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-display font-semibold mb-4">Mes Projets ({myProjects.length})</h3>
          <div className="space-y-3">
            {myProjects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <FolderKanban className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.titre}</p>
                    <span className={`text-xs ${p.chefDeProjet === userEmail ? 'text-primary' : 'text-muted-foreground'}`}>
                      {p.chefDeProjet === userEmail ? 'Chef de projet' : 'Membre'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <ProgressBar value={p.progression} className="w-20" />
                  <StatusBadge status={p.statut} />
                </div>
              </Link>
            ))}
            {myProjects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun projet</p>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-display font-semibold mb-4">Badges & Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Premier projet', '5 tâches terminées', 'Participant actif', 'Chef de projet'].map((b, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                <Award className="h-6 w-6 text-secondary mx-auto mb-1" />
                <p className="text-xs font-medium">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
