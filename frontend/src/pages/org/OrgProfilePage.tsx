import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { fetchEventsByOrganizer, fetchProjectsByOrganisation, fetchUserByEmail } from '@/lib/api';
import { Event, Project } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Building2, CalendarDays, FolderKanban, Mail, Phone, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function OrgProfilePage() {
  const { userName, userEmail } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['org-profile', userEmail],
    queryFn: () => fetchUserByEmail(userEmail),
    enabled: Boolean(userEmail),
  });

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

  const sponsors = Array.isArray(profile?.sponsors) ? profile.sponsors.map(String) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Profil Organisation</h1>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="h-20 w-20 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.logo ? (
                <img src={String(profile.logo)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-10 w-10 text-secondary" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <h2 className="font-display text-xl font-bold">{String(profile?.name || userName || 'Organisation')}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{String(profile?.organizationType || 'Organisation')}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" /> {String(profile?.email || userEmail)}
              </div>
            </div>
            <Link to="/profile/edit">
              <Button variant="outline" size="sm">Modifier</Button>
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-display font-semibold mb-4">Responsable</h3>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{String(profile?.responsableNom || '—')}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {String(profile?.responsableEmail || '—')}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {String(profile?.responsableTelephone || '—')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Projets créés', value: projects.length, icon: FolderKanban, color: 'text-primary' },
            { label: 'Événements', value: events.length, icon: CalendarDays, color: 'text-secondary' },
            { label: 'Membres total', value: projects.reduce((s, p) => s + p.membres.length, 0), icon: User, color: 'text-success' },
            { label: 'Participants', value: events.reduce((s, e) => s + (e.nombrePlaces - e.placesRestantes), 0), icon: Award, color: 'text-warning' },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border p-4 text-center">
              <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-display font-semibold mb-4">Sponsors</h3>
          {sponsors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun sponsor renseigné</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sponsors.map((sponsor) => (
                <div key={sponsor} className="p-4 rounded-lg border text-center hover:bg-muted/30 transition-colors">
                  <p className="font-medium text-sm">{sponsor}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
