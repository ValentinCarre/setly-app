'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_EMOJIS, EQUIPEMENTS } from '@/lib/constants';
 
export default function ProfilPublic() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [role, setRole] = useState(null);
  const [avis, setAvis] = useState([]);
  const [pastSoirees, setPastSoirees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
 
      // Try artist first
      const { data: artist } = await supabase.from('artistes').select('*').eq('id', id).single();
      if (artist) {
        setRole('artiste');
        setProfileData(artist);
 
        // Load reviews
        const { data: reviews } = await supabase.from('avis').select('*, soirees(titre, date_soiree)').eq('reviewed_id', id).order('created_at', { ascending: false });
        setAvis(reviews || []);
 
        // Load past soirées
        const { data: dems } = await supabase.from('demandes').select('*, soirees(*, etablissements:etablissement_id(nom, ville))').eq('artiste_id', id).eq('status', 'accepted');
        const past = (dems || []).filter(d => d.soirees?.date_soiree < new Date().toISOString().split('T')[0]).sort((a, b) => b.soirees.date_soiree.localeCompare(a.soirees.date_soiree));
        setPastSoirees(past);
 
        setLoading(false);
        return;
      }
 
      // Try venue
      const { data: venue } = await supabase.from('etablissements').select('*').eq('id', id).single();
      if (venue) {
        setRole('etablissement');
        setProfileData(venue);
 
        const { data: reviews } = await supabase.from('avis').select('*, soirees(titre, date_soiree)').eq('reviewed_id', id).order('created_at', { ascending: false });
        setAvis(reviews || []);
 
        const { data: soirs } = await supabase.from('soirees').select('*').eq('etablissement_id', id).eq('status', 'confirmed');
        const past = (soirs || []).filter(s => s.date_soiree < new Date().toISOString().split('T')[0]).sort((a, b) => b.date_soiree.localeCompare(a.date_soiree));
        setPastSoirees(past);
      }
 
      setLoading(false);
    }
    load();
  }, [id]);
 
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
  if (!profileData) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">🔍</div><h2 className="font-display text-xl font-bold mb-2">Profil introuvable</h2><Link href="/explorer" className="text-sm text-accent hover:underline">Retour à l&apos;Explorer</Link></div></div>;
 
  const avgRating = avis.length > 0 ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1) : null;
  const formatD = (d) => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); const mn = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']; return `${dt.getDate()} ${mn[dt.getMonth()]} ${dt.getFullYear()}`; };
  const isSelf = currentUserId === id;
  const eqMap = {}; EQUIPEMENTS.forEach(e => { eqMap[e.id] = e; });
 
  if (role === 'artiste') return <ArtistProfile data={profileData} avis={avis} avgRating={avgRating} pastSoirees={pastSoirees} formatD={formatD} isSelf={isSelf} id={id} />;
  return <VenueProfile data={profileData} avis={avis} avgRating={avgRating} pastSoirees={pastSoirees} formatD={formatD} isSelf={isSelf} id={id} eqMap={eqMap} />;
}
 
function ArtistProfile({ data, avis, avgRating, pastSoirees, formatD, isSelf, id }) {
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto">
 
        {/* HERO */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-5 animate-fade-up">
          <div className="h-32 bg-gradient-to-br from-accent/20 via-accent/5 to-bg-mid" />
          <div className="px-6 pb-6 -mt-10">
            <div className="w-20 h-20 rounded-full bg-bg-card border-4 border-bg-card flex items-center justify-center text-3xl overflow-hidden">
              {data.photo_url ? <img src={data.photo_url} alt={data.nom_scene} className="w-full h-full object-cover" /> : <span>{ARTIST_EMOJIS[data.type_artiste] || '🎵'}</span>}
            </div>
            <div className="mt-3 flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">{data.nom_scene}</h1>
                <p className="text-sm text-accent font-medium mt-0.5">{data.type_artiste} · {data.ville}</p>
                {avgRating && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-amber-400 font-semibold">{avgRating}</span>
                    <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                    <span className="text-xs text-dim">({avis.length} avis)</span>
                  </div>
                )}
              </div>
              {!isSelf && (
                <Link href={`/messages?to=${id}&name=${encodeURIComponent(data.nom_scene)}`} className="text-xs px-4 py-2 rounded-lg bg-accent text-black font-medium hover:shadow-lg hover:shadow-accent/20 transition">📩 Contacter</Link>
              )}
              {isSelf && (
                <Link href="/onboarding/artiste" className="text-xs px-4 py-2 rounded-lg bg-bg-mid border border-border text-muted hover:text-white transition">✏️ Modifier</Link>
              )}
            </div>
          </div>
        </div>
 
        {/* BIO */}
        {data.bio && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-sm font-medium mb-2">À propos</h2>
            <p className="text-sm text-muted leading-relaxed">{data.bio}</p>
          </div>
        )}
 
        {/* STYLES */}
        {data.styles?.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.08s' }}>
            <h2 className="text-sm font-medium mb-2">Styles</h2>
            <div className="flex flex-wrap gap-2">
              {data.styles.map(s => (<span key={s} className="text-xs px-3 py-1.5 rounded-full bg-accent/10 border border-accent/15 text-accent">{s}</span>))}
            </div>
          </div>
        )}
 
        {/* DISPOS */}
        {data.disponibilites?.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm font-medium mb-2">Disponibilités</h2>
            <div className="flex gap-2">
              {data.disponibilites.map(j => (<span key={j} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/15 text-accent font-medium">{j}</span>))}
            </div>
          </div>
        )}
 
        {/* SOCIAL LINKS */}
        {(data.soundcloud || data.instagram || data.tiktok || data.youtube || data.spotify) && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <h2 className="text-sm font-medium mb-2">Liens</h2>
            <div className="flex flex-wrap gap-2">
              {data.soundcloud && <a href={data.soundcloud.startsWith('http') ? data.soundcloud : `https://${data.soundcloud}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/15 text-orange-400 hover:bg-orange-500/20 transition">☁️ SoundCloud</a>}
              {data.instagram && <a href={`https://instagram.com/${data.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-pink-500/10 border border-pink-500/15 text-pink-400 hover:bg-pink-500/20 transition">📸 Instagram</a>}
              {data.tiktok && <a href={`https://tiktok.com/@${data.tiktok.replace('@', '')}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">🎵 TikTok</a>}
              {data.youtube && <a href={data.youtube.startsWith('http') ? data.youtube : `https://${data.youtube}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500/20 transition">▶️ YouTube</a>}
              {data.spotify && <a href={data.spotify.startsWith('http') ? data.spotify : `https://${data.spotify}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/15 text-green-400 hover:bg-green-500/20 transition">🎧 Spotify</a>}
            </div>
          </div>
        )}
 
        {/* PAST SOIREES */}
        {pastSoirees.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-sm font-medium mb-2">Soirées réalisées ({pastSoirees.length})</h2>
            <div className="space-y-2">
              {pastSoirees.slice(0, 6).map((d, i) => (
                <div key={i} className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3">
                  <div className="text-center w-10 flex-shrink-0">
                    <div className="text-sm font-semibold">{new Date(d.soirees.date_soiree + 'T00:00:00').getDate()}</div>
                    <div className="text-[9px] text-dim uppercase">{['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][new Date(d.soirees.date_soiree + 'T00:00:00').getMonth()]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{d.soirees.titre}</div>
                    <div className="text-[10px] text-dim">{d.soirees.etablissements?.nom} · {d.soirees.etablissements?.ville}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* AVIS */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.18s' }}>
          <h2 className="text-sm font-medium mb-3">Avis ({avis.length}){avgRating && <span className="text-amber-400 ml-2">★ {avgRating}</span>}</h2>
          {avis.length === 0 ? (
            <div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-2xl mb-2">⭐</div><p className="text-xs text-dim">Aucun avis pour le moment</p></div>
          ) : (
            <div className="space-y-2">
              {avis.map(a => (
                <div key={a.id} className="bg-bg border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-amber-400 text-sm">{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</div>
                    <div className="text-[10px] text-dim">{a.soirees?.titre} · {formatD(a.soirees?.date_soiree)}</div>
                  </div>
                  {a.commentaire && <p className="text-xs text-muted leading-relaxed">{a.commentaire}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
 
        <div className="text-center"><Link href="/explorer" className="text-xs text-dim hover:text-muted transition">← Retour à l&apos;Explorer</Link></div>
      </div>
    </div>
  );
}
 
function VenueProfile({ data, avis, avgRating, pastSoirees, formatD, isSelf, id, eqMap }) {
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto">
 
        {/* HERO */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-5 animate-fade-up">
          {data.photos?.length > 0 ? (
            <div className="h-48 overflow-hidden"><img src={data.photos[0]} alt={data.nom} className="w-full h-full object-cover" /></div>
          ) : (
            <div className="h-32 bg-gradient-to-br from-blue/20 via-blue/5 to-bg-mid" />
          )}
          <div className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">{data.nom}</h1>
                <p className="text-sm text-dim mt-0.5 flex items-center gap-1">📍 {data.adresse || data.ville}</p>
                {data.capacite && <p className="text-xs text-dim mt-0.5">Capacité {data.capacite} personnes</p>}
                {avgRating && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-amber-400 font-semibold">{avgRating}</span>
                    <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                    <span className="text-xs text-dim">({avis.length} avis)</span>
                  </div>
                )}
              </div>
              {!isSelf && (
                <Link href={`/messages?to=${id}&name=${encodeURIComponent(data.nom)}`} className="text-xs px-4 py-2 rounded-lg bg-blue text-black font-medium hover:shadow-lg hover:shadow-blue/20 transition">📩 Contacter</Link>
              )}
              {isSelf && (
                <Link href="/onboarding/etablissement" className="text-xs px-4 py-2 rounded-lg bg-bg-mid border border-border text-muted hover:text-white transition">✏️ Modifier</Link>
              )}
            </div>
          </div>
        </div>
 
        {/* PHOTOS */}
        {data.photos?.length > 1 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-sm font-medium mb-2">Photos</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.photos.map((p, i) => (
                <div key={i} className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-bg-card"><img src={p} alt="" className="w-full h-full object-cover" /></div>
              ))}
            </div>
          </div>
        )}
 
        {/* TYPE + AMBIANCES */}
        {data.type_etablissement?.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.08s' }}>
            <h2 className="text-sm font-medium mb-2">Type</h2>
            <div className="flex flex-wrap gap-2">
              {data.type_etablissement.map(t => (<span key={t} className="text-xs px-3 py-1.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{t}</span>))}
            </div>
          </div>
        )}
 
        {data.ambiances?.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm font-medium mb-2">Ambiances</h2>
            <div className="flex flex-wrap gap-2">
              {data.ambiances.map(a => (<span key={a} className="text-xs px-3 py-1.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{a}</span>))}
            </div>
          </div>
        )}
 
        {/* EQUIPEMENT */}
        {data.equipements?.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <h2 className="text-sm font-medium mb-2">Équipement</h2>
            <div className="flex flex-wrap gap-2">
              {data.equipements.map(eq => { const e = eqMap[eq]; return (<span key={eq} className="text-xs px-3 py-1.5 rounded-full bg-bg-hover text-muted">{e?.icon} {e?.label || eq}</span>); })}
            </div>
          </div>
        )}
 
        {/* LINKS */}
        {data.site_web && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.14s' }}>
            <h2 className="text-sm font-medium mb-2">Site web</h2>
            <a href={data.site_web.startsWith('http') ? data.site_web : `https://${data.site_web}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-blue/10 border border-blue/15 text-blue hover:bg-blue/20 transition inline-flex">🌐 {data.site_web}</a>
          </div>
        )}
 
        {/* HORAIRES */}
        {data.horaires && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-sm font-medium mb-2">Horaires</h2>
            <p className="text-xs text-muted">{data.horaires}</p>
          </div>
        )}
 
        {/* PAST SOIREES */}
        {pastSoirees.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.16s' }}>
            <h2 className="text-sm font-medium mb-2">Soirées organisées ({pastSoirees.length})</h2>
            <div className="space-y-2">
              {pastSoirees.slice(0, 6).map((s, i) => (
                <div key={i} className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3">
                  <div className="text-center w-10 flex-shrink-0">
                    <div className="text-sm font-semibold">{new Date(s.date_soiree + 'T00:00:00').getDate()}</div>
                    <div className="text-[9px] text-dim uppercase">{['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'][new Date(s.date_soiree + 'T00:00:00').getMonth()]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{s.titre}</div>
                    <div className="text-[10px] text-dim">{s.ambiance} · {s.heure_debut}–{s.heure_fin}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* AVIS */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-sm font-medium mb-3">Avis ({avis.length}){avgRating && <span className="text-amber-400 ml-2">★ {avgRating}</span>}</h2>
          {avis.length === 0 ? (
            <div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-2xl mb-2">⭐</div><p className="text-xs text-dim">Aucun avis pour le moment</p></div>
          ) : (
            <div className="space-y-2">
              {avis.map(a => (
                <div key={a.id} className="bg-bg border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-amber-400 text-sm">{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</div>
                    <div className="text-[10px] text-dim">{a.soirees?.titre} · {formatD(a.soirees?.date_soiree)}</div>
                  </div>
                  {a.commentaire && <p className="text-xs text-muted leading-relaxed">{a.commentaire}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
 
        <div className="text-center"><Link href="/explorer" className="text-xs text-dim hover:text-muted transition">← Retour à l&apos;Explorer</Link></div>
      </div>
    </div>
  );
}
 
