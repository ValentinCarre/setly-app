'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_EMOJIS } from '@/lib/constants';
 
export default function Favoris() {
  const [user, setUser] = useState(null);
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
 
      const { data: favData } = await supabase.from('favoris').select('favorited_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      const items = [];
      for (const f of (favData || [])) {
        const { data: art } = await supabase.from('artistes').select('id, nom_scene, type_artiste, ville, photo_url, styles').eq('id', f.favorited_id).single();
        if (art) { items.push({ ...art, role: 'artiste', favDate: f.created_at }); continue; }
        const { data: etab } = await supabase.from('etablissements').select('id, nom, ville, photos, type_etablissement').eq('id', f.favorited_id).single();
        if (etab) items.push({ ...etab, role: 'etablissement', favDate: f.created_at });
      }
 
      // Load ratings
      const ids = items.map(i => i.id);
      const { data: allAvis } = await supabase.from('avis').select('reviewed_id, note');
      const ratingsMap = {};
      (allAvis || []).forEach(a => { if (!ratingsMap[a.reviewed_id]) ratingsMap[a.reviewed_id] = []; ratingsMap[a.reviewed_id].push(a.note); });
      items.forEach(item => {
        const r = ratingsMap[item.id];
        item.avgRating = r ? (r.reduce((s, n) => s + n, 0) / r.length).toFixed(1) : null;
        item.nbAvis = r?.length || 0;
      });
 
      setFavs(items);
      setLoading(false);
    }
    load();
  }, []);
 
  const removeFav = async (id) => {
    await supabase.from('favoris').delete().eq('user_id', user.id).eq('favorited_id', id);
    setFavs(prev => prev.filter(f => f.id !== id));
  };
 
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
 
  return (
    <div className="min-h-screen px-4 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-2xl font-bold mb-5 flex items-center gap-2 animate-fade-up">❤️ Mes favoris</h1>
 
        {favs.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="text-5xl mb-4">🤍</div>
            <h3 className="font-display text-lg font-semibold mb-2">Aucun favori</h3>
            <p className="text-sm text-muted mb-4">Ajoutez des artistes ou établissements en favoris depuis l&apos;Explorer</p>
            <Link href="/explorer" className="text-sm text-accent hover:underline">Explorer →</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {favs.map((item, i) => (
              <div key={item.id} className="bg-bg-card border border-border rounded-2xl p-5 hover:border-accent/20 transition animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start gap-4">
                  <Link href={`/profil/${item.id}`} className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden border border-accent/10">
                    {item.role === 'artiste'
                      ? (item.photo_url ? <img src={item.photo_url} alt="" className="w-full h-full object-cover" /> : ARTIST_EMOJIS[item.type_artiste] || '🎵')
                      : (item.photos?.[0] ? <img src={item.photos[0]} alt="" className="w-full h-full object-cover" /> : '🍸')
                    }
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/profil/${item.id}`} className="font-display font-semibold text-lg hover:text-accent transition">{item.role === 'artiste' ? item.nom_scene : item.nom}</Link>
                      {item.avgRating && <span className="text-xs text-amber-400 font-medium">★ {item.avgRating} ({item.nbAvis})</span>}
                    </div>
                    <p className="text-xs text-accent font-medium mt-0.5">
                      {item.role === 'artiste' ? `${item.type_artiste} · 📍 ${item.ville}` : `📍 ${item.ville}`}
                    </p>
                    {item.role === 'artiste' && item.styles?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">{item.styles.slice(0, 4).map(s => (<span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{s}</span>))}</div>
                    )}
                    {item.role === 'etablissement' && item.type_etablissement?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">{item.type_etablissement.map(t => (<span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">{t}</span>))}</div>
                    )}
                  </div>
                  <button onClick={() => removeFav(item.id)} className="text-red-400 text-lg hover:scale-110 transition flex-shrink-0">❤️</button>
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href={`/profil/${item.id}`} className="flex-1 text-xs py-2 rounded-lg bg-bg-mid border border-border text-muted text-center hover:text-white transition">Voir le profil</Link>
                  <Link href={`/messages?to=${item.id}&name=${encodeURIComponent(item.role === 'artiste' ? item.nom_scene : item.nom)}`} className={`flex-1 text-xs py-2 rounded-lg border text-center transition ${item.role === 'artiste' ? 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20' : 'bg-blue/10 text-blue border-blue/20 hover:bg-blue/20'}`}>📩 Contacter</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
 
