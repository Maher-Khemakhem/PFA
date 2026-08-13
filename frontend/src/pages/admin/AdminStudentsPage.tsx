import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AdminUser, deleteUser, fetchAdminStudents } from '@/lib/api';
import { Search, User, GraduationCap, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { avatarPhoto, imageCandidates } from '@/lib/images';

export default function AdminStudentsPage() {
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: students = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-students'],
    queryFn: fetchAdminStudents,
  });

  const deleteMutation = useMutation({
    mutationFn: (email: string) => deleteUser(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success('Étudiant supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleDelete = (student: AdminUser) => {
    if (confirm(`Supprimer ${student.name || student.email} ?`)) {
      deleteMutation.mutate(student.email);
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.idUniversitaire ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedStudents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Gestion des Étudiants</h1>
              <p className="text-sm text-muted-foreground">{students.length} étudiants inscrits</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total étudiants', value: students.length, color: 'text-primary' },
            { label: 'Actifs ce mois', value: Math.floor(students.length * 0.8), color: 'text-success' },
            { label: 'Nouveaux inscrits', value: Math.floor(students.length * 0.1), color: 'text-secondary' },
            { label: 'Avec compétences', value: students.filter(s => (s.competences?.length ?? 0) > 0).length, color: 'text-warning' },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des étudiants...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun étudiant trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Étudiant</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">ID Univ.</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Faculté</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Compétences</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStudents.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 overflow-hidden shrink-0">
                            <SmartImage sources={imageCandidates(s.avatar, avatarPhoto(s.email))} alt={s.name || s.email} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{s.idUniversitaire || '—'}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{s.faculte || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(s.competences ?? []).slice(0, 2).map(c => (
                            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                          {(s.competences?.length ?? 0) > 2 && (
                            <Badge variant="outline" className="text-xs">+{(s.competences?.length ?? 0) - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" aria-label={`Voir ${s.name}`}>
                               <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>{s.name || 'Étudiant'}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 text-sm">
                                <div>
                                  <p className="text-xs text-muted-foreground">Email</p>
                                  <a className="text-primary hover:underline" href={`mailto:${s.email}`}>{s.email}</a>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">ID universitaire</p>
                                    <p>{s.idUniversitaire || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Faculté</p>
                                    <p>{s.faculte || '—'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Spécialité</p>
                                  <p>{s.specialite || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">Compétences</p>
                                  <div className="flex flex-wrap gap-1">
                                    {(s.competences ?? []).length > 0
                                      ? s.competences!.map(c => <Badge key={c} variant="secondary">{c}</Badge>)
                                      : <span className="text-muted-foreground">Aucune compétence renseignée</span>}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(s)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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
