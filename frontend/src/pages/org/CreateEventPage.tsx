import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { createEvent } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { userEmail } = useAuth();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type: '',
    lieu: '',
    dateHeure: '',
    nombrePlaces: 0,
    affiche: '',
  });
  const [partners, setPartners] = useState<Array<{ name: string; logo: string }>>([
    { name: '', logo: '' },
  ]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      toast.success('Événement créé avec succès');
      navigate('/events');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'événement');
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!userEmail) {
      toast.error('Veuillez vous connecter');
      return;
    }
    const nextErrors: Record<string, string> = {};
    if (!formData.titre.trim()) nextErrors.titre = 'Titre obligatoire.';
    if (!formData.description.trim()) nextErrors.description = 'Description obligatoire.';
    if (!formData.type) nextErrors.type = 'Type obligatoire.';
    if (!formData.lieu.trim()) nextErrors.lieu = 'Lieu obligatoire.';
    if (!formData.dateHeure) nextErrors.dateHeure = 'Date et heure obligatoires.';
    if (!formData.nombrePlaces || formData.nombrePlaces <= 0) nextErrors.nombrePlaces = 'Nombre de places invalide.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error('Veuillez corriger les champs en erreur');
      return;
    }

    const partnerEntries = partners
      .map((partner) => ({
        name: partner.name.trim(),
        logo: partner.logo.trim(),
      }))
      .filter((partner) => partner.name || partner.logo);

    const incompletePartner = partnerEntries.find((partner) => !partner.name || !partner.logo);
    if (incompletePartner) {
      toast.error('Chaque partenaire doit avoir un nom et un logo');
      return;
    }

    createMutation.mutate({
      ...formData,
      organisateur: userEmail,
      partenaires: partnerEntries.map((partner) => partner.name),
      partnerLogos: partnerEntries.map((partner) => partner.logo),
      galleryPhotos,
    });
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
      reader.readAsDataURL(file);
    });

  const handleAfficheChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData({ ...formData, affiche: dataUrl });
    } catch {
      toast.error('Impossible de lire l\'image sélectionnée');
    }
  };

  const handlePartnerNameChange = (index: number, value: string) => {
    setPartners((prev) => prev.map((partner, i) => (i === index ? { ...partner, name: value } : partner)));
  };

  const handlePartnerLogoChange = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPartners((prev) => prev.map((partner, i) => (i === index ? { ...partner, logo: dataUrl } : partner)));
    } catch {
      toast.error('Impossible de lire le logo sélectionné');
    }
  };

  const addPartner = () => {
    setPartners((prev) => [...prev, { name: '', logo: '' }]);
  };

  const removePartner = (index: number) => {
    setPartners((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGalleryPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      const dataUrls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
      setGalleryPhotos((prev) => [...prev, ...dataUrls]);
      event.target.value = '';
    } catch {
      toast.error('Impossible de lire les images sélectionnées');
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-2xl font-bold">Créer un événement</h1>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl border p-6">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              placeholder="Titre de l'événement"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
            {fieldErrors.titre && <p className="text-xs text-destructive">{fieldErrors.titre}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Décrivez l'événement..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Workshop">Workshop</SelectItem>
                <SelectItem value="Compétition">Compétition</SelectItem>
                <SelectItem value="Conférence">Conférence</SelectItem>
                <SelectItem value="Séminaire">Séminaire</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.type && <p className="text-xs text-destructive">{fieldErrors.type}</p>}
          </div>
          <div className="space-y-2">
            <Label>Lieu</Label>
            <Input
              placeholder="Amphithéâtre A"
              value={formData.lieu}
              onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
              required
            />
            {fieldErrors.lieu && <p className="text-xs text-destructive">{fieldErrors.lieu}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date & Heure</Label>
              <Input
                type="datetime-local"
                value={formData.dateHeure}
                onChange={(e) => setFormData({ ...formData, dateHeure: e.target.value })}
                required
              />
              {fieldErrors.dateHeure && <p className="text-xs text-destructive">{fieldErrors.dateHeure}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nombre de places</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.nombrePlaces || ''}
                onChange={(e) => setFormData({ ...formData, nombrePlaces: parseInt(e.target.value) || 0 })}
                required
              />
              {fieldErrors.nombrePlaces && <p className="text-xs text-destructive">{fieldErrors.nombrePlaces}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Affiche (image)</Label>
            <Input type="file" accept="image/*" onChange={handleAfficheChange} />
            {formData.affiche ? (
              <div className="overflow-hidden rounded-xl border bg-muted">
                <img src={formData.affiche} alt="Affiche" className="h-48 w-full object-cover" />
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Partenaires (nom + logo)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPartner}>
                Ajouter un partenaire
              </Button>
            </div>
            <div className="space-y-4">
              {partners.map((partner, index) => (
                <div key={`partner-${index}`} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      placeholder="Nom du partenaire"
                      value={partner.name}
                      onChange={(event) => handlePartnerNameChange(index, event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePartner(index)}
                      disabled={partners.length === 1}
                    >
                      Supprimer
                    </Button>
                  </div>
                  <Input type="file" accept="image/*" onChange={(event) => handlePartnerLogoChange(index, event)} />
                  {partner.logo ? (
                    <div className="overflow-hidden rounded-lg border bg-muted">
                      <img src={partner.logo} alt={partner.name || 'Logo partenaire'} className="h-24 w-full object-contain" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label>Photos des editions precedentes</Label>
            <Input type="file" accept="image/*" multiple onChange={handleGalleryPhotos} />
            {galleryPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryPhotos.map((photo, index) => (
                  <div key={`gallery-${index}`} className="relative overflow-hidden rounded-xl border bg-muted">
                    <img src={photo} alt={`Photo ${index + 1}`} className="h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(index)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/events')}>Annuler</Button>
            <Button type="submit" className="gradient-primary border-0 text-primary-foreground" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
