import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { fetchEvents, participateInEvent, cancelEventParticipation } from '@/lib/api';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SmartImage } from '@/components/SmartImage';
import { eventPhoto, imageCandidates } from '@/lib/images';

export default function StudentEventsPage() {
  const { userEmail } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
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
      toast.success('Participation enregistrée');
    },
    onError: () => toast.error("Erreur lors de l'inscription"),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      cancelEventParticipation(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Participation annulée');
    },
    onError: () => toast.error("Erreur lors de l'annulation"),
  });

  const toggle = (eventId: string, isJoined: boolean) => {
    if (!userEmail) {
      toast.error('Veuillez vous connecter');
      return;
    }
    if (isJoined) cancelMutation.mutate({ eventId, email: userEmail });
    else participateMutation.mutate({ eventId, email: userEmail });
  };

  const myEvents = events.filter(e => userEmail && e.participants.includes(userEmail));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Événements</h1>
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

        {myEvents.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-medium text-primary mb-3">Mes participations ({myEvents.length})</p>
            <div className="flex flex-wrap gap-2">
              {myEvents.map(e => (
                <Badge key={e.id} variant="secondary" className="text-xs">{e.titre}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Événements disponibles', value: events.length, color: 'text-primary' },
            { label: 'Mes participations', value: myEvents.length, color: 'text-success' },
            { label: 'Places disponibles', value: events.filter(e => e.placesRestantes > 0).length, color: 'text-secondary' },
          ].map((s, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des événements...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(e => {
              const isJoined = userEmail ? e.participants.includes(userEmail) : false;
              const isFull = e.placesRestantes === 0;
              return (
                <Link key={e.id} to={`/events/${e.id}`} className="block">
                  <div className={`bg-card rounded-xl border overflow-hidden shadow-card hover:shadow-elevated transition-shadow cursor-pointer ${isJoined ? 'border-primary/40' : ''}`}>
                    <div className="h-36 bg-muted relative">
                      <SmartImage sources={imageCandidates(e.affiche, eventPhoto(e.id || e.titre))} alt={e.titre} />
                      {isJoined && (
                        <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                          Inscrit
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="font-display font-semibold">{e.titre}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(e.dateHeure).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(e.dateHeure).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
                          onClick={ev => { ev.preventDefault(); ev.stopPropagation(); toggle(e.id, isJoined); }}
                        >
                          {isJoined ? 'Annuler' : 'Participer'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
