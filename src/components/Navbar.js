'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
 
export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userIdRef = useRef(null);
  const supabase = createClient();
 
  async function refreshUnread(uid) { const id = uid || userIdRef.current; if (!id) return; const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', id).eq('read', false); setUnreadCount(count || 0); }
 
  useEffect(() => {
    let interval, checkInterval;
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        userIdRef.current = user.id;
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        if (prof?.role === 'artiste') { const { data: art } = await supabase.from('artistes').select('nom_scene').eq('id', user.id).single(); setDisplayName(art?.nom_scene || ''); }
        else if (prof?.role === 'etablissement') { const { data: etab } = await supabase.from('etablissements').select('nom').eq('id', user.id).single(); setDisplayName(etab?.nom || ''); }
        refreshUnread(user.id);
      }
    }
    loadUser();
    interval = setInterval(() => refreshUnread(), 5000);
    function onStorage() { refreshUnread(); }
    window.addEventListener('storage', onStorage);
    checkInterval = setInterval(() => { const ts = localStorage.getItem('setly-messages-read'); if (ts && Date.now() - parseInt(ts) < 3000) refreshUnread(); }, 1000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user || null; setUser(u);
      if (u) { userIdRef.current = u.id; const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).single(); setProfile(prof); if (prof?.role === 'artiste') { const { data: art } = await supabase.from('artistes').select('nom_scene').eq('id', u.id).single(); setDisplayName(art?.nom_scene || ''); } else if (prof?.role === 'etablissement') { const { data: etab } = await supabase.from('etablissements').select('nom').eq('id', u.id).single(); setDisplayName(etab?.nom || ''); } refreshUnread(u.id); }
      else { setProfile(null); setDisplayName(''); setUnreadCount(0); userIdRef.current = null; }
    });
    return () => { subscription.unsubscribe(); clearInterval(interval); clearInterval(checkInterval); window.removeEventListener('storage', onStorage); };
  }, []);
 
  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); setDisplayName(''); setUnreadCount(0); setMenuOpen(false); setMobileOpen(false); window.location.href = '/'; };
  const closeAll = () => { setMenuOpen(false); setMobileOpen(false); };
 
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl sm:text-2xl font-extrabold tracking-tight" onClick={closeAll}>Set<span className="text-accent">ly</span></Link>
 
        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/explorer" className="text-sm text-muted hover:text-white transition">Explorer</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/messages" className="relative w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white hover:border-dim transition">💬{unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>}</Link>
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-sm bg-bg-card border border-border rounded-lg px-3 py-2 hover:border-muted transition">
                  <span className="text-lg">{profile?.role === 'artiste' ? '🎧' : '🍸'}</span>
                  <span className="text-muted">{displayName || user.email?.split('@')[0]}</span>
                  <svg className={`w-3 h-3 text-dim transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-bg-card border border-border rounded-xl p-2 animate-fade-up shadow-xl">
                    <Link href="/profil" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>👤</span> Mon profil</Link>
                    <Link href="/messages" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>💬</span> Messages{unreadCount > 0 && <span className="ml-auto min-w-[18px] h-[18px] bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadCount}</span>}</Link>
                    <Link href="/favoris" onClick={closeAll} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>❤️</span> Favoris</Link>
                    <hr className="border-border my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition"><span>🚪</span> Déconnexion</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-muted border border-border px-4 py-2 rounded-lg hover:text-white hover:border-muted transition flex items-center gap-2"><span>👤</span> Connexion</Link>
              <Link href="/signup" className="text-sm font-semibold bg-accent text-black px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-accent/25 transition">S&apos;inscrire</Link>
            </div>
          )}
        </div>
 
        {/* MOBILE NAV */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Link href="/messages" className="relative w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted">💬{unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-accent text-black text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">{unreadCount > 9 ? '9+' : unreadCount}</span>}</Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted">
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
 
      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-card animate-fade-up">
          <div className="px-4 py-3 space-y-1">
            {user ? (<>
              <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border mb-2 pb-3">
                <span className="text-lg">{profile?.role === 'artiste' ? '🎧' : '🍸'}</span>
                <span className="text-sm font-medium">{displayName || user.email?.split('@')[0]}</span>
              </div>
              <Link href="/profil" onClick={closeAll} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>👤</span> Mon profil</Link>
              <Link href="/explorer" onClick={closeAll} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>🔍</span> Explorer</Link>
              <Link href="/messages" onClick={closeAll} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>💬</span> Messages{unreadCount > 0 && <span className="ml-auto min-w-[18px] h-[18px] bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">{unreadCount}</span>}</Link>
              <Link href="/favoris" onClick={closeAll} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>❤️</span> Favoris</Link>
              <hr className="border-border my-2" />
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition"><span>🚪</span> Déconnexion</button>
            </>) : (<>
              <Link href="/explorer" onClick={closeAll} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>🔍</span> Explorer</Link>
              <Link href="/login" onClick={closeAll} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted hover:bg-bg-hover hover:text-white transition"><span>👤</span> Connexion</Link>
              <Link href="/signup" onClick={closeAll} className="block text-center text-sm font-semibold bg-accent text-black px-4 py-3 rounded-lg mt-2">S&apos;inscrire</Link>
            </>)}
          </div>
        </div>
      )}
    </nav>
  );
}
 
