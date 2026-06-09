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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;

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

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-2xl mx-auto animate-fade-up">
        {isArtist ? (
          /* ======= ARTIST PROFILE ======= */
          <div>
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              {/* Cover */}
              <div className="h-32 bg-gradient-to-br from-accent/10 to-bg-mid relative">
                {data.photo_url && (
                  <div className="absolute -bottom-8 left-6 w-20 h-20 rounded-full border-4 border-bg-card overflow-hidden bg-bg-mid">
                    <img src={data.photo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {!data.photo_url && (
                  <div className="absolute -bottom-8 left-6 w-20 h-20 rounded-full border-4 border-bg-card bg-accent/10 flex items-center justify-center text-3xl">
                    {ARTIST_EMOJIS[data.type_artiste] || '🎵'}
                  </div>
                )}
              </div>

              <div className="pt-12 px-6 pb-6">
                <h1 className="font-display text-2xl font-bold">{data.nom_scene}</h1>
                <p className="text-sm text-accent font-medium mt-1">{data.type_artiste} · {data.ville}</p>

                {data.bio && <p className="text-sm text-muted mt-4 leading-relaxed">{data.bio}</p>}

                {data.styles?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {data.styles.map(s => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">{s}</span>
                    ))}
                  </div>
                )}

                {data.disponibilites?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-dim uppercase tracking-wider font-medium mb-2">Disponibilités</p>
                    <div className="flex gap-2">
                      {data.disponibilites.map(j => (
                        <span key={j} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">{j}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social links */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {data.soundcloud && <a href={data.soundcloud.startsWith('http') ? data.soundcloud : `https://${data.soundcloud}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition">☁️ SoundCloud</a>}
                  {data.instagram && <a href={`https://instagram.com/${data.instagram.replace('@','')}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition">📸 Instagram</a>}
                  {data.spotify && <a href={data.spotify.startsWith('http') ? data.spotify : `https://${data.spotify}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition">🎧 Spotify</a>}
                  {data.youtube && <a href={data.youtube.startsWith('http') ? data.youtube : `https://${data.youtube}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition">▶️ YouTube</a>}
                  {data.tiktok && <a href={`https://tiktok.com/${data.tiktok.replace('@','')}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-white/5 text-muted border border-white/10 hover:bg-white/10 transition">🎵 TikTok</a>}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/onboarding/artiste" className="text-sm text-muted hover:text-white transition">✏️ Modifier mon profil</Link>
            </div>
          </div>
        ) : (
          /* ======= VENUE PROFILE ======= */
          <div>
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
              {/* Photos carousel */}
              {data.photos?.length > 0 && (
                <div className="h-40 flex overflow-x-auto gap-1">
                  {data.photos.map((p, i) => (
                    <img key={i} src={p} alt="" className="h-full w-auto object-cover flex-shrink-0" />
                  ))}
                </div>
              )}
              {!data.photos?.length && (
                <div className="h-32 bg-gradient-to-br from-blue/10 to-bg-mid" />
              )}

              <div className="px-6 py-5">
                <h1 className="font-display text-2xl font-bold">{data.nom}</h1>
                <p className="text-sm text-muted mt-1 flex items-center gap-1">📍 {data.adresse || data.ville}</p>
                {data.capacite && <p className="text-sm text-muted mt-1">Capacité {data.capacite} pers.</p>}

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
        )}
      </div>
    </div>
  );
}
