'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

function SignupForm() {
  const searchParams = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!role) { setError('Choisissez votre profil'); return; }
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères'); return; }
    if (password !== confirmPw) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true);
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) {
      setError(signupError.message === 'User already registered' ? 'Un compte existe déjà avec cet email' : signupError.message);
      setLoading(false);
      return;
    }
    const userId = data.user.id;
    await supabase.from('profiles').insert({ id: userId, role, onboarding_done: false });
    router.push(`/onboarding/${role === 'artiste' ? 'artiste' : 'etablissement'}`);
  };

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="text-center mb-8">
        <div className="font-display text-3xl font-extrabold mb-2">Set<span className="text-accent">ly</span></div>
        <p className="text-sm text-dim">Créez votre compte gratuitement</p>
      </div>
      <form onSubmit={handleSignup} className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
        {error && (<div className="bg-red-400/10 border border-red-400/20 text-red-400 text-sm px-4 py-2.5 rounded-lg">{error}</div>)}
        <div>
          <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Je suis</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setRole('artiste')} className={`flex items-center gap-3 p-3.5 rounded-xl border transition text-left ${role === 'artiste' ? 'border-accent bg-accent-dim' : 'border-border bg-bg-mid hover:border-dim'}`}>
              <span className="text-2xl">🎧</span>
              <div><div className={`text-sm font-semibold ${role === 'artiste' ? 'text-accent' : 'text-white'}`}>Artiste</div><div className="text-xs text-dim">DJ, chanteur, musicien…</div></div>
            </button>
            <button type="button" onClick={() => setRole('etablissement')} className={`flex items-center gap-3 p-3.5 rounded-xl border transition text-left ${role === 'etablissement' ? 'border-blue bg-blue-dim' : 'border-border bg-bg-mid hover:border-dim'}`}>
              <span className="text-2xl">🍸</span>
              <div><div className={`text-sm font-semibold ${role === 'etablissement' ? 'text-blue' : 'text-white'}`}>Établissement</div><div className="text-xs text-dim">Bar, café, club…</div></div>
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-accent transition" placeholder="votre@email.com" />
        </div>
        <div>
          <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Mot de passe</label>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-accent transition pr-12" placeholder="8 caractères minimum" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition text-sm">{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>
        <div>
          <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Confirmer le mot de passe</label>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className={`w-full bg-bg-mid border rounded-lg px-4 py-3 text-sm text-white transition pr-12 ${confirmPw && confirmPw !== password ? 'border-red-400' : 'border-border focus:border-accent'}`} placeholder="Retapez votre mot de passe" />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition text-sm">{showConfirm ? '🙈' : '👁️'}</button>
          </div>
          {confirmPw && confirmPw !== password && (<p className="text-red-400 text-xs mt-1.5">⚠️ Les mots de passe ne correspondent pas</p>)}
        </div>
        <button type="submit" disabled={loading} className={`w-full font-bold py-3 rounded-xl transition disabled:opacity-50 ${role === 'etablissement' ? 'bg-blue text-black' : 'bg-accent text-black'}`}>
          {loading ? 'Création du compte...' : 'Créer mon compte'}
        </button>
      </form>
      <p className="text-center text-sm text-dim mt-6">Déjà un compte ? <Link href="/login" className="text-accent font-semibold hover:underline">Se connecter</Link></p>
    </div>
  );
}

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <Suspense fallback={<div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
