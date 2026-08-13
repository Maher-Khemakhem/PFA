import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser, fetchEventsByOrganizer, fetchMyProjects, fetchProjectsByOrganisation } from '@/lib/api';
import { Project, User as UserType } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, GraduationCap, Award, FolderKanban, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SmartImage } from '@/components/SmartImage';
import { avatarPhoto, imageCandidates, organizationPhoto, projectPhoto } from '@/lib/images';

function StudentProfile() {
  const { userEmail } = useAuth();
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<UserType>({ queryKey: ['currentUser'], queryFn: fetchCurrentUser });
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects', 'mine'],
    queryFn: fetchMyProjects,
  });

  if (isLoadingUser || isLoadingProjects) return <div className="p-8 text-center text-muted-foreground">Chargement du profil...</div>;
  if (!currentUser) return <div className="p-8 text-center text-destructive">Erreur: Utilisateur non trouvé</div>;

  const myProjects = projects;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 overflow-hidden shrink-0">
            <SmartImage
              sources={imageCandidates(currentUser.avatar, avatarPhoto(currentUser.email))}
              alt={`${currentUser.prenom} ${currentUser.nom}`}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">{currentUser.prenom} {currentUser.nom}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> {currentUser.email}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> {currentUser.faculte} — {currentUser.specialite}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              ID: {currentUser.idUniversitaire}
            </div>
          </div>
          <Link to="/profile/edit">
            <Button variant="outline" size="sm">Modifier</Button>
          </Link>
        </div>
      </div>

      {/* Competences */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-display font-semibold mb-3">Compétences</h3>
        <div className="flex flex-wrap gap-2">
          {currentUser.competences?.map(c => (
            <Badge key={c} variant="secondary">{c}</Badge>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-display font-semibold mb-3">Projets ({myProjects.length})</h3>
        <div className="space-y-3">
          {myProjects.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-14 rounded-md overflow-hidden bg-muted">
                  <SmartImage sources={imageCandidates(undefined, projectPhoto(p.id || p.titre))} alt={p.titre} />
                </div>
                <div>
                  <span className="text-sm font-medium">{p.titre}</span>
                  <p className="text-xs text-muted-foreground">{p.categorie}</p>
                </div>
              </div>
              <Badge variant="outline">{p.statut}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-display font-semibold mb-3">Badges & Achievements</h3>
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
  );
}

function OrgProfile() {
  const { userName, userEmail } = useAuth();
  const { data: currentUser } = useQuery<UserType>({ queryKey: ['currentUser'], queryFn: fetchCurrentUser });
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects', 'org', userName],
    queryFn: () => fetchProjectsByOrganisation(userName),
    enabled: Boolean(userName),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['events', 'org', userEmail],
    queryFn: () => fetchEventsByOrganizer(),
    enabled: Boolean(userEmail),
  });

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-2xl bg-secondary/10 overflow-hidden shrink-0">
            <SmartImage
              sources={imageCandidates(currentUser?.logo, organizationPhoto(userName || userEmail))}
              alt={userName || 'Organisation'}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">{userName || currentUser?.email}</h2>
            <p className="text-sm text-muted-foreground mt-1">Type: {currentUser?.organizationType || 'Organisation'}</p>
            <p className="text-sm text-muted-foreground">Responsable: {currentUser?.responsableNom || 'Non renseigne'}</p>
            <p className="text-sm text-muted-foreground">Email: {currentUser?.responsableEmail || userEmail}</p>
          </div>
          <Button variant="outline" size="sm">Modifier</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-display font-semibold mb-3">Sponsors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Microsoft', 'Google', 'AWS'].map((s, i) => (
            <div key={i} className="p-4 rounded-lg border text-center">
              <p className="font-medium text-sm">{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border p-6 text-center">
          <p className="text-3xl font-display font-bold text-primary">{projects.length}</p>
          <p className="text-sm text-muted-foreground">Projets créés</p>
        </div>
        <div className="bg-card rounded-xl border p-6 text-center">
          <p className="text-3xl font-display font-bold text-secondary">{events.length}</p>
          <p className="text-sm text-muted-foreground">Événements créés</p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { userRole } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">
          {userRole === 'organization' ? 'Profil Organisation' : 'Mon Profil'}
        </h1>
        {userRole === 'organization' ? <OrgProfile /> : <StudentProfile />}
      </div>
    </DashboardLayout>
  );
}
