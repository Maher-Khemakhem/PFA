import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { fetchMyProjects } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Eye, FolderKanban } from 'lucide-react';
import { SmartImage } from '@/components/SmartImage';
import { imageCandidates, projectPhoto } from '@/lib/images';

export default function StudentProjectsPage() {
  const PAGE_SIZE = 10;
  const { userEmail } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects', 'mine'],
    queryFn: fetchMyProjects,
  });

  const myProjects = projects;

  const categories = Array.from(new Set(myProjects.map(p => p.categorie).filter(Boolean))).sort();
  const searchValue = search.trim().toLowerCase();
  const filtered = myProjects.filter(p => {
    const matchSearch = !searchValue || [
      p.titre,
      p.categorie,
      p.chefDeProjetNom,
    ].some(value => (value || '').toLowerCase().includes(searchValue));
    const matchStatus = statusFilter === 'all' || p.statut === statusFilter;
    const matchCategory = categoryFilter === 'all' || p.categorie === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedProjects = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Projets</h1>
              <p className="text-sm text-muted-foreground">{myProjects.length} projet(s) auxquels vous participez</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Planifié">Planifié</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Terminé">Terminé</SelectItem>
              <SelectItem value="En Retard">En Retard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Categorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Mes projets', value: myProjects.length, color: 'text-primary' },
            { label: 'En cours', value: myProjects.filter(p => p.statut === 'En cours').length, color: 'text-success' },
            { label: 'En retard', value: myProjects.filter(p => p.statut === 'En Retard').length, color: 'text-destructive' },
            { label: 'Terminés', value: myProjects.filter(p => p.statut === 'Terminé').length, color: 'text-muted-foreground' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des projets...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun projet trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Rôle</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Progression</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Deadline</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProjects.map(p => {
                    const isChef = p.chefDeProjet === userEmail;
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <Link to={`/projects/${p.id}`} className="flex items-center gap-3 group">
                            <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                              <SmartImage sources={imageCandidates(undefined, projectPhoto(p.id || p.titre))} alt={p.titre} />
                            </div>
                            <div>
                              <p className="font-medium text-sm group-hover:text-primary">{p.titre}</p>
                              <p className="text-xs text-muted-foreground">{p.categorie}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isChef ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {isChef ? 'Chef' : 'Membre'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={p.progression} className="w-20" />
                            <span className="text-xs text-muted-foreground">{p.progression}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{p.dateFin}</td>
                        <td className="px-5 py-4"><StatusBadge status={p.statut} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            <Link to={`/projects/${p.id}`}>
                              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
