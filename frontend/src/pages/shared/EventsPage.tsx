import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, fetchEventsByOrganizer, participateInEvent, cancelEventParticipation, deleteEvent, updateEvent } from '@/lib/api';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, MapPin, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { eventPhoto, imageCandidates } from '@/lib/images';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EventForm = {
  titre: string;
  description: string;
  type: string;
  organisateur: string;
  dateHeure: string;
  lieu: string;
  nombrePlaces: string;
  partenaires: string;
  affiche: string;
};

function toInputDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function eventToForm(event: Event): EventForm {
  return {
    titre: event.titre,
    description: event.description,
    type: event.type,
    organisateur: event.organisateur || event.createurs[0] || '',
    dateHeure: toInputDateTime(event.dateHeure),
    lieu: event.lieu,
    nombrePlaces: String(event.nombrePlaces),
    partenaires: event.partenaires.join(', '),
    affiche: event.affiche || '',
  };
}

export default function EventsPage() {
  const { userRole, userEmail } = useAuth();
  const queryClient = useQueryClient();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<EventForm | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events', userRole, userEmail],
    queryFn: () => (userRole === 'organization' ? fetchEventsByOrganizer() : fetchEvents()),
    enabled: userRole !== 'organization' || Boolean(userEmail),
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

  const participateMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      participateInEvent(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation enregistrée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de l\'inscription à l\'événement');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      cancelEventParticipation(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation annulée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'annulation');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Événement supprimé');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, form }: { eventId: string; form: EventForm }) =>
      updateEvent(eventId, {
        titre: form.titre,
        description: form.description,
        type: form.type,
        organisateur: form.organisateur,
        dateHeure: form.dateHeure,
        lieu: form.lieu,
        nombrePlaces: Number(form.nombrePlaces) || 0,
        partenaires: form.partenaires.split(',').map(p => p.trim()).filter(Boolean),
        affiche: form.affiche,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setEditingEvent(null);
      setEventForm(null);
      toast.success('Événement modifié');
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    }
  });

  const toggleParticipate = (eventId: string, isParticipating: boolean) => {
    if (!userEmail) {
      toast.error('Veuillez vous connecter');
      return;
    }

    if (isParticipating) {
      cancelMutation.mutate({ eventId, email: userEmail });
    } else {
      participateMutation.mutate({ eventId, email: userEmail });
    }
  };

  const handleDelete = (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      deleteMutation.mutate(eventId);
    }
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setEventForm(eventToForm(event));
  };

  const setEventField = (field: keyof EventForm, value: string) => {
    setEventForm(current => current ? { ...current, [field]: value } : current);
  };

  const handleUpdate = () => {
    if (!editingEvent || !eventForm) return;
    updateMutation.mutate({ eventId: editingEvent.id, form: eventForm });
  };

  if (userRole === 'organization' || userRole === 'admin') {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">Événements</h1>
            {userRole === 'organization' && (
              <Link to="/events/create"><Button className="gap-1 gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4" /> Créer Event</Button></Link>
            )}
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
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Titre</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Participants</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Chargement des événements...</td></tr>
                ) : (
                  filteredEvents.map(e => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                            <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{e.titre}</p>
                            <p className="text-xs text-muted-foreground">{e.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(e.dateHeure).toLocaleDateString('fr-FR')}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{e.nombrePlaces - e.placesRestantes}/{e.nombrePlaces}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/events/${e.id}`}>
                            <Button variant="ghost" size="sm">Voir</Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(e)}>Modifier</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(e.id)}>Supprimer</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => {
            if (!open) {
              setEditingEvent(null);
              setEventForm(null);
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier l'événement</DialogTitle>
              </DialogHeader>
              {eventForm && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input value={eventForm.titre} onChange={e => setEventField('titre', e.target.value)} placeholder="Titre" />
                    <Input value={eventForm.type} onChange={e => setEventField('type', e.target.value)} placeholder="Type" />
                    <Input type="datetime-local" value={eventForm.dateHeure} onChange={e => setEventField('dateHeure', e.target.value)} />
                    <Input value={eventForm.lieu} onChange={e => setEventField('lieu', e.target.value)} placeholder="Lieu" />
                    <Input type="number" min="0" value={eventForm.nombrePlaces} onChange={e => setEventField('nombrePlaces', e.target.value)} placeholder="Nombre de places" />
                    <Input value={eventForm.organisateur} onChange={e => setEventField('organisateur', e.target.value)} placeholder="Organisateur" />
                  </div>
                  <Textarea value={eventForm.description} onChange={e => setEventField('description', e.target.value)} placeholder="Description" />
                  <Input value={eventForm.partenaires} onChange={e => setEventField('partenaires', e.target.value)} placeholder="Partenaires séparés par des virgules" />
                  <Input value={eventForm.affiche} onChange={e => setEventField('affiche', e.target.value)} placeholder="URL affiche" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingEvent(null)}>Annuler</Button>
                    <Button onClick={handleUpdate} disabled={updateMutation.isPending || !eventForm.titre || !eventForm.dateHeure}>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Événements</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">Chargement des événements...</div>
          ) : (
            filteredEvents.map(e => {
              const isJoined = userEmail ? e.participants.includes(userEmail) : false;
              const isFull = e.placesRestantes === 0;
              return (
                <Link key={e.id} to={`/events/${e.id}`} className="block">
                  <div className="bg-card rounded-xl border overflow-hidden shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
                    <div className="h-36 bg-muted">
                      <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="font-display font-semibold">{e.titre}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(e.dateHeure).toLocaleDateString('fr-FR')} à {new Date(e.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {e.lieu}
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant={isFull ? 'destructive' : 'secondary'} className="text-xs">
                          {isFull ? 'Complet' : `${e.placesRestantes} places`}
                        </Badge>
                        <Button
                          size="sm"
                          variant={isJoined ? 'outline' : 'default'}
                          disabled={isFull && !isJoined}
                          onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); toggleParticipate(e.id, isJoined); }}
                        >
                          {isJoined ? 'Annuler' : 'Participer'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
