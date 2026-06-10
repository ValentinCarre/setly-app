'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_EMOJIS, EQUIPEMENTS } from '@/lib/constants';
 
export default function Profil() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
 
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
 
      if (prof?.role === 'artiste') {
        const { data: art } = await supabase.from('artistes').select('*').eq('id', user.id).single();
        setData(art);
      } else {
        const { data: etab } = await supabase.from('etablissements').select('*').eq('id', user.id).single();
        setData(etab);
      }
      setLoading(false);
    }
    load();
  }, []);
 
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );
 
  if (!profile?.onboarding_done || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center animate-fade-up">
          <div className="text-5xl mb-4">{profile?.role === 'artiste' ? '🎧' : '🍸'}</div>
          <h2 className="font-display text-xl font-bold mb-2">Profil incomplet</h2>
          <p className="text-sm text-muted mb-6">Complétez votre profil pour être visible</p>
          <Link href={`/onboarding/${profile?.role === 'artiste' ? 'artiste' : 'etablissement'}`}
            className="bg-accent text-black font-bold px-6 py-3 rounded-xl inline-block hover:shadow-lg hover:shadow-accent/25 transition">
            Compléter mon profil
          </Link>
        </div>
      </div>
    );
  }
 
  const isArtist = profile.role === 'artiste';
 
  // Calculate profile completion
  function getCompletion() {
    if (isArtist) {
      const fields = [data.nom_scene, data.ville, data.type_artiste, data.bio, data.photo_url, data.styles?.length > 0, data.disponibilites?.length > 0, data.soundcloud || data.instagram || data.spotify || data.youtube || data.tiktok];
      return Math.round((fields.filter(Boolean).length / fields.length) * 100);
    }
    return 80;
  }
  const completion = getCompletion();
 
  if (isArtist) {
    return <ArtistDashboard data={data} user={user} completion={completion} />;
  }
 
  return <VenueDashboard data={data} user={user} completion={completion} />;
}
 
function ArtistDashboard({ data, user, completion }) {
  // Placeholder requests - will be replaced by real data when booking system is built
  const requests = [
    { id: 1, venue: 'Le Zinc — Bar à vins', emoji: '🍸', city: 'Cannes', desc: 'Soirée Deep House terrasse', date: 'Sam 21 juin · 22h–02h', status: 'new' },
    { id: 2, venue: 'La Terrazza', emoji: '🍽️', city: 'Cannes', desc: 'Set techno lounge', date: 'Ven 27 juin · 20h–23h', status: 'pending' },
    { id: 3, venue: 'Café de la Plage', emoji: '🏖️', city: 'Nice', desc: 'DJ set coucher de soleil', date: 'Sam 14 juin · 18h–22h', status: 'confirmed' },
  ];
 
  const events = [
    { day: '14', month: 'Juin', title: 'DJ set coucher de soleil', venue: 'Café de la Plage · Nice', time: '18h – 22h', status: 'confirmed' },
    { day: '21', month: 'Juin', title: 'Soirée Deep House terrasse', venue: 'Le Zinc · Cannes', time: '22h – 02h', status: 'new' },
  ];
 
  const statusStyles = {
    new: { bg: 'bg-accent/10 border-accent/20 text-accent', label: 'Nouveau' },
    pending: { bg: 'bg-blue/10 border-blue/20 text-blue', label: 'En attente' },
    confirmed: { bg: 'bg-green-400/10 border-green-400/20 text-green-400', label: 'Confirmé' },
  };
 
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto">
 
        {/* TOP BAR */}
        <div className="flex items-center justify-between pb-4 border-b border-border mb-5 animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-bg-mid flex items-center justify-center text-xl overflow-hidden border-2 border-accent/20">
              {data.photo_url
                ? <img src={data.photo_url} alt="" className="w-full h-full object-cover" />
                : <span>{ARTIST_EMOJIS[data.type_artiste] || '🎵'}</span>}
            </div>
            <div>
              <div className="font-display text-lg font-semibold">Salut, {data.nom_scene}</div>
              <span className="inline-flex items-center gap-1 text-xs bg-accent/10 border border-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium">⚡ Ambassadeur</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white hover:border-dim transition relative">
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-bg"></span>
            </button>
            <Link href="/onboarding/artiste" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white hover:border-dim transition">
              ⚙️
            </Link>
          </div>
        </div>
 
        {/* STATS */}
        <div className="grid grid-cols-4 gap-3 mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {[
            { val: '12', label: 'Vues profil', color: 'text-accent' },
            { val: '3', label: 'Demandes', color: 'text-blue' },
            { val: '2', label: 'Soirées jouées', color: 'text-accent' },
            { val: '4.9', label: 'Note moyenne', color: 'text-white' },
          ].map((s, i) => (
            <div key={i} className="bg-bg-card rounded-xl p-3.5 text-center">
              <div className={`text-xl font-semibold ${s.color}`}>{s.val}</div>
              <div className="text-[11px] text-dim mt-1">{s.label}</div>
            </div>
          ))}
        </div>
 
        {/* REQUESTS */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium flex items-center gap-2">📩 Demandes reçues</h2>
            <span className="text-xs text-dim cursor-pointer hover:text-muted transition">Tout voir</span>
          </div>
 
          <div className="space-y-2">
            {requests.map(r => {
              const st = statusStyles[r.status];
              return (
                <div key={r.id} className="bg-bg border border-border rounded-xl p-4 hover:border-dim transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center text-lg">{r.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{r.venue}</div>
                      <div className="text-xs text-dim mt-0.5">{r.city} · {r.desc}</div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${st.bg}`}>{st.label}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-dim flex items-center gap-1.5">📅 {r.date}</span>
                    <div className="flex gap-2">
                      {r.status === 'new' && (
                        <>
                          <button className="text-xs px-3 py-1.5 rounded-lg bg-bg-card border border-border text-muted hover:text-white transition">Refuser</button>
                          <button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-black font-medium hover:shadow-lg hover:shadow-accent/20 transition">Accepter</button>
                        </>
                      )}
                      {(r.status === 'pending' || r.status === 'confirmed') && (
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-blue/10 text-blue border border-blue/20 hover:bg-blue/20 transition">💬 Message</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* UPCOMING EVENTS */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="text-sm font-medium flex items-center gap-2 mb-3">📅 Prochaines soirées</h2>
          <div className="space-y-2">
            {events.map((e, i) => {
              const st = statusStyles[e.status];
              return (
                <div key={i} className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4 hover:border-dim transition">
                  <div className="text-center w-12 flex-shrink-0">
                    <div className="text-lg font-semibold">{e.day}</div>
                    <div className="text-[10px] text-dim uppercase tracking-wider">{e.month}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="text-xs text-dim mt-0.5">{e.venue}</div>
                    <div className="text-xs text-accent flex items-center gap-1 mt-1">🕐 {e.time}</div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${st.bg}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* PROFILE PREVIEW */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium flex items-center gap-2">👤 Mon profil</h2>
            <Link href="/onboarding/artiste" className="text-xs text-dim hover:text-muted transition">Modifier</Link>
          </div>
 
          <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-bg-mid flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 border-2 border-accent/15">
              {data.photo_url
                ? <img src={data.photo_url} alt="" className="w-full h-full object-cover" />
                : <span>{ARTIST_EMOJIS[data.type_artiste] || '🎵'}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{data.nom_scene}</div>
              <div className="text-xs text-accent mt-0.5">{data.type_artiste} · {data.ville}</div>
              {data.styles?.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {data.styles.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/15 text-accent">{s}</span>
                  ))}
                  {data.styles.length > 4 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card text-dim">+{data.styles.length - 4}</span>}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-lg font-semibold ${completion === 100 ? 'text-green-400' : 'text-accent'}`}>{completion}%</div>
              <div className="text-[10px] text-dim">Complet</div>
            </div>
          </div>
        </div>
 
        {/* TIP */}
        {completion < 100 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <div className="bg-accent/5 border border-accent/10 rounded-xl p-4 flex items-start gap-3">
              <span className="text-lg">💡</span>
              <div>
                <div className="text-sm font-medium">Complétez votre profil à 100%</div>
                <div className="text-xs text-dim mt-1 leading-relaxed">Ajoutez votre lien SoundCloud et une photo de scène pour apparaître 3x plus dans les recherches des établissements.</div>
              </div>
            </div>
          </div>
        )}
 
        {/* BOTTOM NAV */}
        <div className="flex justify-around pt-4 border-t border-border mt-6">
          {[
            { icon: '🏠', label: 'Accueil', active: true },
            { icon: '🔍', label: 'Explorer', href: '/explorer' },
            { icon: '📅', label: 'Agenda' },
            { icon: '💬', label: 'Messages' },
            { icon: '👤', label: 'Profil', href: '/onboarding/artiste' },
          ].map((n, i) => (
            n.href ? (
              <Link key={i} href={n.href} className="flex flex-col items-center gap-1 cursor-pointer">
                <span className={`text-lg ${n.active ? '' : 'opacity-40'}`}>{n.icon}</span>
                <span className={`text-[9px] uppercase tracking-wider ${n.active ? 'text-accent' : 'text-dim'}`}>{n.label}</span>
              </Link>
            ) : (
              <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                <span className={`text-lg ${n.active ? '' : 'opacity-40'}`}>{n.icon}</span>
                <span className={`text-[9px] uppercase tracking-wider ${n.active ? 'text-accent' : 'text-dim'}`}>{n.label}</span>
              </div>
            )
          ))}
        </div>
 
      </div>
    </div>
  );
}
 
function VenueDashboard({ data, user, completion }) {
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto animate-fade-up">
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          {data.photos?.length > 0 && (
            <div className="h-40 flex overflow-x-auto gap-1">
              {data.photos.map((p, i) => (
                <img key={i} src={p} alt="" className="h-full w-auto object-cover flex-shrink-0" />
              ))}
            </div>
          )}
          {!data.photos?.length && <div className="h-32 bg-gradient-to-br from-blue/10 to-bg-mid" />}
          <div className="px-6 py-5">
            <h1 className="font-display text-2xl font-bold">{data.nom}</h1>
            <p className="text-sm text-muted mt-1 flex items-center gap-1">📍 {data.adresse || data.ville}</p>
            {data.type_etablissement?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {data.type_etablissement.map(t => (
                  <span key={t} className="text-xs px-3 py-1 rounded-full bg-blue/10 border border-blue/20 text-blue">{t}</span>
                ))}
              </div>
            )}
            {data.ambiances?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-dim uppercase tracking-wider font-medium mb-2">Ambiances</p>
                <div className="flex flex-wrap gap-2">
                  {data.ambiances.map(a => (
                    <span key={a} className="text-xs px-3 py-1 rounded-full bg-blue/10 border border-blue/20 text-blue">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {data.equipements?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-dim uppercase tracking-wider font-medium mb-2">Équipement</p>
                <div className="flex flex-wrap gap-2">
                  {data.equipements.map(eq => {
                    const e = EQUIPEMENTS.find(x => x.id === eq);
                    return <span key={eq} className="text-xs px-3 py-1 rounded-full bg-bg-hover text-muted">{e?.icon} {e?.label || eq}</span>;
                  })}
                </div>
              </div>
            )}
            {data.site_web && (
              <a href={data.site_web.startsWith('http') ? data.site_web : `https://${data.site_web}`} target="_blank"
                className="mt-4 flex items-center gap-2 bg-blue/5 border border-blue/15 rounded-lg px-4 py-2.5 text-sm text-blue hover:bg-blue/10 transition">
                🌐 {data.site_web}
              </a>
            )}
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link href="/onboarding/etablissement" className="text-sm text-muted hover:text-white transition">✏️ Modifier ma fiche</Link>
        </div>
      </div>
    </div>
  );
}
