import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AdminUser, deleteUser, fetchAdminOrganizations } from '@/lib/api';
import { Search, Building2, Trash2, Eye, FolderKanban, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { imageCandidates, organizationPhoto } from '@/lib/images';

export default function AdminOrganizationsPage() {
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: orgs = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-organizations'],
    queryFn: fetchAdminOrganizations,
  });

  const deleteMutation = useMutation({
    mutationFn: (email: string) => deleteUser(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Organisation supprimée');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleDelete = (organization: AdminUser) => {
    if (confirm(`Supprimer ${organization.name || organization.email} ?`)) {
      deleteMutation.mutate(organization.email);
    }
  };

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    (o.organizationType ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedOrgs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const typeColor = (type?: string) => {
    if (type === 'Club') return 'bg-primary/10 text-primary';
    if (type === 'Association') return 'bg-secondary/15 text-secondary-foreground';
    if (type === 'Département') return 'bg-accent/15 text-accent-foreground';
    return '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Gestion des Organisations</h1>
              <p className="text-sm text-muted-foreground">{orgs.length} organisations inscrites</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total organisations', value: orgs.length, color: 'text-secondary' },
            { label: 'Clubs', value: orgs.filter(o => o.organizationType === 'Club').length, color: 'text-primary' },
            { label: 'Associations', value: orgs.filter(o => o.organizationType === 'Association').length, color: 'text-secondary' },
            { label: 'Départements', value: orgs.filter(o => o.organizationType === 'Département').length, color: 'text-accent' },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Cards grid */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des organisations...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune organisation trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pagedOrgs.map(o => (
              <div key={o.id} className="bg-card rounded-xl border p-5 hover:shadow-elevated transition-shadow space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-secondary/10 overflow-hidden shrink-0">
                      <SmartImage sources={imageCandidates(o.logo, organizationPhoto(o.email || o.name))} alt={o.name || o.email} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.email}</p>
                    </div>
                  </div>
                  {o.organizationType && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${typeColor(o.organizationType)}`}>
                      {o.organizationType}
                    </span>
                  )}
                </div>

                {o.responsableNom && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Responsable:</span> {o.responsableNom}
                    {o.responsableEmail && <span className="ml-1">({o.responsableEmail})</span>}
                  </div>
                )}

                {(o.sponsors ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {o.sponsors!.slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    {o.sponsors!.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{o.sponsors!.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t">
                  <Button variant="ghost" size="sm" className="gap-1 flex-1 text-xs" asChild>
                    <Link to="/admin/projects"><FolderKanban className="h-3.5 w-3.5" /> Projets</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 flex-1 text-xs" asChild>
                    <Link to="/admin/events"><CalendarDays className="h-3.5 w-3.5" /> Événements</Link>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs" aria-label={`Voir ${o.name}`}>
                      <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{o.name || 'Organisation'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <a className="text-primary hover:underline" href={`mailto:${o.email}`}>{o.email}</a>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p>{o.organizationType || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Responsable</p>
                            <p>{o.responsableNom || '—'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email responsable</p>
                          {o.responsableEmail
                            ? <a className="text-primary hover:underline" href={`mailto:${o.responsableEmail}`}>{o.responsableEmail}</a>
                            : <p>—</p>}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Sponsors</p>
                          <div className="flex flex-wrap gap-1">
                            {(o.sponsors ?? []).length > 0
                              ? o.sponsors!.map(sponsor => <Badge key={sponsor} variant="outline">{sponsor}</Badge>)
                              : <span className="text-muted-foreground">Aucun sponsor renseigné</span>}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs"
                    onClick={() => handleDelete(o)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((prev) => Math.max(1, prev - 1));
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    setPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </DashboardLayout>
  );
}
