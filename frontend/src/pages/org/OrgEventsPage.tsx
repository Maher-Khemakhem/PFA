import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteEvent, fetchEventsByOrganizer, updateEvent } from '@/lib/api';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, MapPin, Plus, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { eventPhoto, imageCandidates } from '@/lib/images';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function toInputDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function OrgEventsPage() {
  const queryClient = useQueryClient();
  const { userEmail } = useAuth();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [editForm, setEditForm] = useState({
    titre: '',
    description: '',
    type: '',
    dateHeure: '',
    lieu: '',
    nombrePlaces: '',
    partenaires: '',
    affiche: '',
  });

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events', userEmail],
    queryFn: () => fetchEventsByOrganizer(),
    enabled: Boolean(userEmail),
  });

  const eventTypes = Array.from(new Set(events.map(e => e.type).filter(Boolean))).sort();
  const searchValue = search.trim().toLowerCase();
  const now = new Date();
  const filteredEvents = events.filter(e => {
    const matchesSearch = !searchValue || [
      e.titre,
      e.description,
      e.type,
      e.lieu,
      e.organisateur,
    ].some(value => (value || '').toLowerCase().includes(searchValue));
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    const isFull = e.placesRestantes === 0;
    const matchesAvailability = availabilityFilter === 'all'
      || (availabilityFilter === 'available' && !isFull)
      || (availabilityFilter === 'full' && isFull);
    const eventDate = new Date(e.dateHeure);
    const matchesTime = timeFilter === 'all'
      || (timeFilter === 'upcoming' && eventDate >= now)
      || (timeFilter === 'past' && eventDate < now);
    return matchesSearch && matchesType && matchesAvailability && matchesTime;
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ event, form }: { event: Event; form: typeof editForm }) =>
      updateEvent(event.id, {
        titre: form.titre,
        description: form.description,
        type: form.type,
        organisateur: event.organisateur || userEmail,
        dateHeure: form.dateHeure,
        lieu: form.lieu,
        nombrePlaces: Number(form.nombrePlaces) || 0,
        partenaires: form.partenaires.split(',').map(p => p.trim()).filter(Boolean),
        partnerLogos: event.partnerLogos || [],
        affiche: form.affiche,
        galleryPhotos: event.galleryPhotos || [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement modifié');
      setEditingEvent(null);
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });

  const handleDelete = (event: Event) => {
    if (confirm(`Supprimer l'événement "${event.titre}" ?`)) {
      deleteMutation.mutate(event.id);
    }
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      titre: event.titre,
      description: event.description,
      type: event.type,
      dateHeure: toInputDateTime(event.dateHeure),
      lieu: event.lieu,
      nombrePlaces: String(event.nombrePlaces),
      partenaires: event.partenaires.join(', '),
      affiche: event.affiche || '',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Mes Événements</h1>
          <Link to="/events/create">
            <Button className="gap-1 gradient-primary border-0 text-primary-foreground">
              <Plus className="h-4 w-4" /> Créer un événement
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: events.length, color: 'text-primary' },
            { label: 'Participants', value: events.reduce((s, e) => s + (e.nombrePlaces - e.placesRestantes), 0), color: 'text-success' },
            { label: 'Complets', value: events.filter(e => e.placesRestantes === 0).length, color: 'text-destructive' },
            { label: 'Disponibles', value: events.filter(e => e.placesRestantes > 0).length, color: 'text-secondary' },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un événement..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {eventTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Disponibilite" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="full">Complets</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Periode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="upcoming">A venir</SelectItem>
              <SelectItem value="past">Passees</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des événements...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aucun événement créé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Lieu</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Participants</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(e => {
                    const filled = e.nombrePlaces - e.placesRestantes;
                    const isFull = e.placesRestantes === 0;
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                              <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                            </div>
                            <span className="font-medium text-sm">{e.titre}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><Badge variant="outline" className="text-xs">{e.type}</Badge></td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(e.dateHeure).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{e.lieu}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">{filled}/{e.nombrePlaces}</td>
                        <td className="px-5 py-4">
                          <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">
                            {isFull ? 'Complet' : `${e.placesRestantes} places`}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/events/${e.id}`}>
                              <Button variant="ghost" size="sm">Voir</Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>Modifier</Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(e)}
                              disabled={deleteMutation.isPending}
                            >
                              Supprimer
                            </Button>
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

        <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => !open && setEditingEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Modifier l'événement</DialogTitle></DialogHeader>
            {editingEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} placeholder="Titre" />
                  <Input value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} placeholder="Type" />
                  <Input type="datetime-local" value={editForm.dateHeure} onChange={e => setEditForm({ ...editForm, dateHeure: e.target.value })} />
                  <Input value={editForm.lieu} onChange={e => setEditForm({ ...editForm, lieu: e.target.value })} placeholder="Lieu" />
                  <Input type="number" min="0" value={editForm.nombrePlaces} onChange={e => setEditForm({ ...editForm, nombrePlaces: e.target.value })} placeholder="Nombre de places" />
                  <Input value={editForm.affiche} onChange={e => setEditForm({ ...editForm, affiche: e.target.value })} placeholder="URL affiche" />
                </div>
                <Textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                <Input value={editForm.partenaires} onChange={e => setEditForm({ ...editForm, partenaires: e.target.value })} placeholder="Partenaires séparés par des virgules" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingEvent(null)}>Annuler</Button>
                  <Button
                    onClick={() => updateMutation.mutate({ event: editingEvent, form: editForm })}
                    disabled={updateMutation.isPending || !editForm.titre || !editForm.dateHeure}
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
