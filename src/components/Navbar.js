'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
 
export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();
 
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
 
        // Fetch display name from artiste or etablissement table
        if (prof?.role === 'artiste') {
          const { data: art } = await supabase.from('artistes').select('nom_scene').eq('id', user.id).single();
          setDisplayName(art?.nom_scene || '');
        } else if (prof?.role === 'etablissement') {
          const { data: etab } = await supabase.from('etablissements').select('nom').eq('id', user.id).single();
          setDisplayName(etab?.nom || '');
        }
      }
    }
    loadUser();
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setProfile(prof);
        if (prof?.role === 'artiste') {
          const { data: art } = await supabase.from('artistes').select('nom_scene').eq('id', u.id).single();
          setDisplayName(art?.nom_scene || '');
        } else if (prof?.role === 'etablissement') {
          const { data: etab } = await supabase.from('etablissements').select('nom').eq('id', u.id).single();
          setDisplayName(etab?.nom || '');
        }
      } else {
        setProfile(null);
        setDisplayName('');
      }
    });
 
    return () => subscription.unsubscribe();
  }, []);
 
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setDisplayName('');
    setMenuOpen(false);
    window.location.href = '/';
  };
 
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
          Set<span className="text-accent">ly</span>
        </Link>
 
        <div className="flex items-center gap-6">
          <Link href="/explorer" className="text-sm text-muted hover:text-white transition hidden md:block">
            Explorer
          </Link>
 
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm bg-bg-card border border-border rounded-lg px-3 py-2 hover:border-muted transition"
              >
                <span className="text-lg">{profile?.role === 'artiste' ? '🎧' : '🍸'}</span>
                <span className="text-muted hidden sm:block">{displayName || user.email?.split('@')[0]}</span>
                <svg className={`w-3 h-3 text-dim transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
 
              {menuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-bg-card border border-border rounded-xl p-2 animate-fade-up shadow-xl">
                  <Link
                    href="/profil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"
                  >
                    <span>👤</span> Mon profil
                  </Link>
                  {profile && !profile.onboarding_done && (
                    <Link
                      href={`/onboarding/${profile.role === 'artiste' ? 'artiste' : 'etablissement'}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-accent hover:bg-accent-dim transition"
                    >
                      <span>✏️</span> Compléter mon profil
                    </Link>
                  )}
                  <Link
                    href="/explorer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition md:hidden"
                  >
                    <span>🔍</span> Explorer
                  </Link>
                  <hr className="border-border my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition"
                  >
                    <span>🚪</span> Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-muted border border-border px-4 py-2 rounded-lg hover:text-white hover:border-muted transition hidden sm:flex items-center gap-2"
              >
                <span>👤</span> Connexion
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-accent text-black px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-accent/25 transition"
              >
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
 
