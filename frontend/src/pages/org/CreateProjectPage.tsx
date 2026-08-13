import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userEmail, userName } = useAuth();

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [chefProjet, setChefProjet] = useState('');
  const [visibilite, setVisibilite] = useState<'PUBLIC' | 'PRIVE'>('PUBLIC');
  const [ressourceNom, setRessourceNom] = useState('');
  const [ressourceLien, setRessourceLien] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userName && organisation !== userName) {
      setOrganisation(userName);
    }
  }, [userName, organisation]);

  useEffect(() => {
    if (userEmail && chefProjet !== userEmail) {
      setChefProjet(userEmail);
    }
  }, [userEmail, chefProjet]);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', userName] });
      toast.success('Projet créé avec succès !');
      navigate('/projects');
    },
    onError: () => {
      toast.error('Erreur lors de la création du projet');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!titre.trim()) nextErrors.titre = 'Titre obligatoire.';
    if (!description.trim()) nextErrors.description = 'Description obligatoire.';
    if (!organisation) nextErrors.organisation = 'Organisation obligatoire.';
    if (!chefProjet.trim()) nextErrors.chefProjet = 'Chef de projet obligatoire.';
    if (!startDate) nextErrors.startDate = 'Date de début obligatoire.';
    if (!deadline) nextErrors.deadline = 'Date de fin obligatoire.';
    if (startDate && deadline && new Date(startDate) > new Date(deadline)) {
      nextErrors.deadline = 'La date de fin doit être après la date de début.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error('Veuillez corriger les champs en erreur');
      return;
    }
    setFieldErrors({});

    createMutation.mutate({
      titre,
      desc: description,
      chefProjet,
      organisation,
      deadline,
      validite: true,
      visibilite,
      ressources: ressourceNom.trim() || ressourceLien.trim()
        ? [{ nom: ressourceNom.trim() || 'Ressource', valeur: ressourceLien.trim() }]
        : [],
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold">Nouveau Projet</h1>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border p-6">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              placeholder="Titre du projet"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
            {fieldErrors.titre && <p className="text-xs text-destructive">{fieldErrors.titre}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez le projet..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label>Organisation</Label>
            <Input value={organisation} readOnly />
            {fieldErrors.organisation && <p className="text-xs text-destructive">{fieldErrors.organisation}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              {fieldErrors.startDate && <p className="text-xs text-destructive">{fieldErrors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              {fieldErrors.deadline && <p className="text-xs text-destructive">{fieldErrors.deadline}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Chef de projet (Email)</Label>
            <Input value={chefProjet} readOnly />
            {fieldErrors.chefProjet && <p className="text-xs text-destructive">{fieldErrors.chefProjet}</p>}
          </div>
          <div className="space-y-2">
            <Label>VisibilitÃ©</Label>
            <Select value={visibilite} onValueChange={(value) => setVisibilite(value as 'PUBLIC' | 'PRIVE')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVE">PrivÃ©</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ressource</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Nom de la ressource"
                value={ressourceNom}
                onChange={(e) => setRessourceNom(e.target.value)}
              />
              <Input
                placeholder="Lien ou référence"
                value={ressourceLien}
                onChange={(e) => setRessourceLien(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/projects')} disabled={createMutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" className="gradient-primary border-0 text-primary-foreground" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer projet'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
