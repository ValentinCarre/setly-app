'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }

    // Check profile and redirect
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (profile?.onboarding_done) {
      router.push('/profil');
    } else if (profile?.role) {
      router.push(`/onboarding/${profile.role === 'artiste' ? 'artiste' : 'etablissement'}`);
    } else {
      router.push('/profil');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-extrabold mb-2">Set<span className="text-accent">ly</span></div>
          <p className="text-sm text-dim">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleLogin} className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-accent transition"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-accent transition pr-12"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-muted transition text-sm">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-accent text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-accent/25 transition disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-dim mt-6">
          Pas encore de compte ? <Link href="/signup" className="text-accent font-semibold hover:underline">S'inscrire gratuitement</Link>
        </p>
      </div>
    </div>
  );
}
