import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Eye, EyeOff, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

const personas: Array<{ label: string; role: UserRole; icon: typeof GraduationCap; color: string; }> = [
  { label: 'Étudiant', role: 'student', icon: GraduationCap, color: 'border-primary/40 hover:bg-primary/10' },
  { label: 'Organisation', role: 'organization', icon: Building2, color: 'border-secondary/40 hover:bg-secondary/15' },
  { label: 'Admin', role: 'admin', icon: ShieldCheck, color: 'border-accent/40 hover:bg-accent/10' },
];

const FST_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/fr/8/8d/FSTLOGO.svg';
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nextErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      nextErrors.email = 'Email obligatoire.';
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Email invalide.';
    }
    if (!password.trim()) {
      nextErrors.password = 'Mot de passe obligatoire.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    try {
      const resolvedRole = await signIn(email, password, role);
      const target = resolvedRole === 'admin'
        ? '/dashboard/admin'
        : resolvedRole === 'organization'
          ? '/dashboard/organization'
          : '/dashboard/student';
      navigate(target);
    } catch {
      setError('Rôle invalide pour ce compte ou identifiants incorrects.');
    }
  };

  return (
    <div className="min-h-screen lg:pr-[50vw]">
      {/* Left - Form */}
      <div className="min-h-screen flex items-center justify-center p-8 lg:overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <div className="h-9 w-9 rounded-lg bg-white border border-border flex items-center justify-center p-1">
                <img src={FST_LOGO_URL} alt="FST" className="h-full w-full object-contain" />
              </div>
              <span className="font-display font-bold">FSTEAM</span>
            </Link>
            <h1 className="font-display text-2xl font-bold">Connexion</h1>
            <p className="text-muted-foreground mt-1">Choisissez votre profil ou connectez-vous</p>
          </div>

          {/* Persona quick-access */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Accès rapide par profil</p>
            <div className="grid grid-cols-3 gap-3">
              {personas.map(({ label, role: roleValue, icon: Icon, color }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRole(roleValue)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${color} ${role === roleValue ? 'ring-2 ring-primary/40' : ''} dark:hover:bg-white/10`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 border-t" />
          </div>

          {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="votre.email@fst.utm.tn" value={email} onChange={e => setEmail(e.target.value)} />
              {fieldErrors.email && (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Étudiant</SelectItem>
                  <SelectItem value="organization">Organisation</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
              <Link to="#" className="text-xs text-primary hover:underline">Mot de passe oublié ?</Link>
            </div>
            <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">Connexion</Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas de compte ? <Link to="/signup/student" className="text-primary hover:underline">Créer un compte</Link>
          </p>
        </div>
      </div>

      {/* Right - Image */}
      <div className="hidden lg:block fixed inset-y-0 right-0 w-[50vw]">
        <img
          src={HERO_IMAGE_URL}
          alt="Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
        <div className="relative h-full flex items-end p-12">
          <div className="text-white/90 max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">FSTEAM</p>
            <h2 className="font-display text-3xl font-bold mt-3">Faculté des Sciences de Tunis</h2>
            <p className="text-white/70 mt-3">Votre plateforme de gestion de projets et d'evenements universitaires</p>
          </div>
        </div>
      </div>
    </div>
  );
}
