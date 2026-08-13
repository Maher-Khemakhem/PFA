import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface SponsorInput { nom: string; logo: string; lien: string; }

export default function SignupOrgPage() {
  const FST_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/fr/8/8d/FSTLOGO.svg';
  const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80';
  const [sponsors, setSponsors] = useState<SponsorInput[]>([]);
  const { signUpOrganization } = useAuth();
  const navigate = useNavigate();

  // All fields for registration
  const [clubName, setClubName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [responsableNom, setResponsableNom] = useState("");
  const [responsableEmail, setResponsableEmail] = useState("");
  const [responsableTelephone, setResponsableTelephone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const emailPattern = /^[^\s@]+@[^\s@-]+-fst\.utm\.tn$/i;
  const normalizePhone = (value: string) => value.replace(/[^\d]/g, "");

  const addSponsor = () => setSponsors([...sponsors, { nom: '', logo: '', lien: '' }]);
  const removeSponsor = (i: number) => setSponsors(sponsors.filter((_, idx) => idx !== i));
  const updateSponsor = (i: number, field: keyof SponsorInput, value: string) => {
    const updated = [...sponsors];
    updated[i][field] = value;
    setSponsors(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nextErrors: Record<string, string> = {};
    if (!clubName.trim()) nextErrors.clubName = 'Nom obligatoire.';
    if (!organizationType) nextErrors.organizationType = 'Type obligatoire.';
    if (email.trim() && !emailPattern.test(email.trim())) {
      nextErrors.email = 'Email invalide (ex: contact@club-fst.utm.tn).';
    }
    if (!password.trim()) {
      nextErrors.password = 'Mot de passe obligatoire.';
    } else if (password.trim().length < 6) {
      nextErrors.password = 'Mot de passe trop court (6 caractères min).';
    }
    if (!responsableNom.trim()) nextErrors.responsableNom = 'Nom du responsable obligatoire.';
    if (!responsableEmail.trim()) {
      nextErrors.responsableEmail = 'Email du responsable obligatoire.';
    } else if (!emailPattern.test(responsableEmail.trim())) {
      nextErrors.responsableEmail = 'Email du responsable invalide (ex: prenom@club-fst.utm.tn).';
    }
    const phoneDigits = normalizePhone(responsableTelephone);
    if (!responsableTelephone.trim()) {
      nextErrors.responsableTelephone = 'Téléphone obligatoire.';
    } else if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      nextErrors.responsableTelephone = 'Numéro de téléphone invalide.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    try {
      await signUpOrganization({
        email,
        password,
        name: clubName,
        organizationType,
        responsableNom,
        responsableEmail,
        responsableTelephone,
        sponsors: sponsors.map(s => s.nom),
      });
      navigate('/dashboard');
    } catch {
      setFormError('Erreur lors de la création du compte. Vérifiez vos informations.');
    }
  };

  return (
    <div className="min-h-screen lg:pr-[50vw]">
      <div className="min-h-screen flex items-center justify-center p-6 lg:overflow-y-auto">
        <div className="w-full max-w-lg space-y-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white border border-border flex items-center justify-center p-1">
              <img src={FST_LOGO_URL} alt="FST" className="h-full w-full object-contain" />
            </div>
            <span className="font-display font-bold">FSTEAM</span>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Inscription Organisation</h1>
            <p className="text-muted-foreground mt-1">Créez votre compte organisationnel</p>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du club / association / département</Label>
              <Input placeholder="Club IEEE FST" value={clubName} onChange={(e) => setClubName(e.target.value)} />
              {fieldErrors.clubName && <p className="text-xs text-destructive">{fieldErrors.clubName}</p>}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={organizationType} onValueChange={setOrganizationType}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Club">Club</SelectItem>
                  <SelectItem value="Association">Association</SelectItem>
                  <SelectItem value="Département">Département</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.organizationType && <p className="text-xs text-destructive">{fieldErrors.organizationType}</p>}
            </div>
            <div className="space-y-2">
              <Label>Email officiel (optionnel)</Label>
              <Input
                type="email"
                placeholder="club@fst.utm.tn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Mot de passe</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
            </div>

            <div className="p-4 rounded-xl bg-muted/50 space-y-3">
              <Label className="text-sm font-semibold">Infos du responsable</Label>
              <div className="space-y-2">
                <Input placeholder="Nom du responsable" value={responsableNom} onChange={(e) => setResponsableNom(e.target.value)} />
                {fieldErrors.responsableNom && <p className="text-xs text-destructive">{fieldErrors.responsableNom}</p>}
                <Input type="email" placeholder="Email" value={responsableEmail} onChange={(e) => setResponsableEmail(e.target.value)} />
                {fieldErrors.responsableEmail && <p className="text-xs text-destructive">{fieldErrors.responsableEmail}</p>}
                <Input type="tel" placeholder="Téléphone" value={responsableTelephone} onChange={(e) => setResponsableTelephone(e.target.value)} />
                {fieldErrors.responsableTelephone && <p className="text-xs text-destructive">{fieldErrors.responsableTelephone}</p>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Sponsors</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSponsor} className="gap-1">
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              </div>
              {sponsors.map((s, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">Sponsor {i + 1}</span>
                    <button type="button" onClick={() => removeSponsor(i)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input placeholder="Nom" value={s.nom} onChange={e => updateSponsor(i, 'nom', e.target.value)} />
                  <Input placeholder="Lien (optionnel)" value={s.lien} onChange={e => updateSponsor(i, 'lien', e.target.value)} />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">Créer le compte organisationnel</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ? <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
            {' · '}
            <Link to="/signup/student" className="text-primary hover:underline">Inscription Étudiant</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block fixed inset-y-0 right-0 w-[50vw]">
        <img
          src={HERO_IMAGE_URL}
          alt="Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
        <div className="relative h-full flex items-end p-10">
          <div className="text-white/90 max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">FSTEAM</p>
            <h2 className="font-display text-3xl font-bold mt-3">Donnez vie a votre organisation</h2>
            <p className="text-white/70 mt-3">Lancez des projets, animez des evenements et mobilisez vos membres.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
