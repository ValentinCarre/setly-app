'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_TYPES, ARTIST_STYLES, ARTIST_EMOJIS } from '@/lib/constants';
 
export default function Explorer() {
  const [artistes, setArtistes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dispoFilter, setDispoFilter] = useState('');
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      let query = supabase.from('artistes').select('*').order('created_at', { ascending: false });
      if (typeFilter) query = query.eq('type_artiste', typeFilter);
      const { data } = await query;
      setArtistes(data || []);
      setLoading(false);
    }
    setLoading(true);
    load();
  }, [typeFilter]);
 
  // Client-side filtering
  const filtered = artistes.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      const match = a.nom_scene?.toLowerCase().includes(q) ||
        a.ville?.toLowerCase().includes(q) ||
        a.styles?.some(s => s.toLowerCase().includes(q)) ||
        a.type_artiste?.toLowerCase().includes(q) ||
        a.bio?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (styleFilter && !a.styles?.includes(styleFilter)) return false;
    if (villeFilter && !a.ville?.toLowerCase().includes(villeFilter.toLowerCase())) return false;
    if (dispoFilter && !a.disponibilites?.includes(dispoFilter)) return false;
    return true;
  });
 
  // Get unique cities and styles from results
  const allVilles = [...new Set(artistes.map(a => a.ville).filter(Boolean))];
  const availableStyles = typeFilter ? (ARTIST_STYLES[typeFilter] || []) : [...new Set(artistes.flatMap(a => a.styles || []))];
 
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-5xl mx-auto">
 
        {/* HEADER */}
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Explorer les artistes</h1>
          <p className="text-sm text-muted mt-2">Trouvez l'artiste idéal pour votre prochaine soirée</p>
        </div>
 
        {/* SEARCH BAR */}
        <div className="mb-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg">🔍</span>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-accent transition placeholder:text-dim"
              placeholder="Rechercher par nom, ville, style..."
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-dim hover:text-muted text-sm">✕</button>
            )}
          </div>
        </div>
 
        {/* TYPE FILTER */}
        <div className="mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => { setTypeFilter(''); setStyleFilter(''); }}
              className={`chip whitespace-nowrap flex-shrink-0 ${!typeFilter ? 'active' : ''}`}>
              Tous
            </button>
            {ARTIST_TYPES.map(t => (
              <button key={t} onClick={() => { setTypeFilter(t); setStyleFilter(''); }}
                className={`chip whitespace-nowrap flex-shrink-0 ${typeFilter === t ? 'active' : ''}`}>
                {ARTIST_EMOJIS[t]} {t}
              </button>
            ))}
          </div>
        </div>
 
        {/* STYLE FILTER (appears when type is selected or if there are styles) */}
        {availableStyles.length > 0 && (
          <div className="mb-4 animate-fade-up" style={{ animationDelay: '0.12s' }}>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => setStyleFilter('')}
                className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition ${!styleFilter ? 'bg-accent/10 border-accent/30 text-accent font-medium' : 'bg-bg-card border-border text-dim hover:border-dim'}`}>
                Tous les styles
              </button>
              {availableStyles.slice(0, 12).map(s => (
                <button key={s} onClick={() => setStyleFilter(styleFilter === s ? '' : s)}
                  className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition ${styleFilter === s ? 'bg-accent/10 border-accent/30 text-accent font-medium' : 'bg-bg-card border-border text-dim hover:border-dim'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
 
        {/* SECONDARY FILTERS */}
        <div className="flex gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.14s' }}>
          {allVilles.length > 1 && (
            <select value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)}
              className="bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted focus:border-accent transition appearance-none cursor-pointer">
              <option value="">Toutes les villes</option>
              {allVilles.map(v => (<option key={v} value={v}>{v}</option>))}
            </select>
          )}
          <select value={dispoFilter} onChange={(e) => setDispoFilter(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted focus:border-accent transition appearance-none cursor-pointer">
            <option value="">Toutes les dispos</option>
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j => (<option key={j} value={j}>{j}</option>))}
          </select>
          {(search || styleFilter || villeFilter || dispoFilter) && (
            <button onClick={() => { setSearch(''); setStyleFilter(''); setVilleFilter(''); setDispoFilter(''); }}
              className="text-xs text-accent hover:underline flex-shrink-0">
              Réinitialiser les filtres
            </button>
          )}
        </div>
 
        {/* RESULTS COUNT */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-dim">
            {loading ? 'Chargement...' : `${filtered.length} artiste${filtered.length !== 1 ? 's' : ''} trouvé${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>
 
        {/* RESULTS */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="font-display text-lg font-semibold mb-2">Aucun artiste trouvé</h3>
            <p className="text-sm text-muted mb-4">Essayez avec d'autres filtres ou une autre recherche</p>
            <button onClick={() => { setSearch(''); setTypeFilter(''); setStyleFilter(''); setVilleFilter(''); setDispoFilter(''); }}
              className="text-sm text-accent hover:underline">Voir tous les artistes</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((a, i) => (
              <div key={a.id} className="bg-bg-card border border-border rounded-2xl p-5 hover:border-accent/20 hover:-translate-y-0.5 transition animate-fade-up group"
                style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}>
 
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden border border-accent/10 group-hover:border-accent/20 transition">
                    {a.photo_url
                      ? <img src={a.photo_url} alt={a.nom_scene} className="w-full h-full object-cover" />
                      : ARTIST_EMOJIS[a.type_artiste] || '🎵'
                    }
                  </div>
 
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-lg leading-tight">{a.nom_scene}</h3>
                    </div>
                    <p className="text-xs text-accent font-medium mt-0.5">{a.type_artiste} · {a.ville}</p>
 
                    {a.bio && (
                      <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">{a.bio}</p>
                    )}
 
                    {/* Styles */}
                    {a.styles?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {a.styles.slice(0, 5).map(s => (
                          <span key={s}
                            onClick={() => setStyleFilter(s)}
                            className={`text-[10px] px-2.5 py-0.5 rounded-full cursor-pointer transition ${styleFilter === s ? 'bg-accent/20 border border-accent/40 text-accent font-medium' : 'bg-accent/10 border border-accent/15 text-accent hover:bg-accent/15'}`}>
                            {s}
                          </span>
                        ))}
                        {a.styles.length > 5 && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-bg-hover text-dim">+{a.styles.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
 
                {/* Bottom section */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    {/* Dispos */}
                    {a.disponibilites?.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-dim">Dispo :</span>
                        {a.disponibilites.map(j => (
                          <span key={j}
                            onClick={() => setDispoFilter(j)}
                            className={`text-[10px] font-medium cursor-pointer transition ${dispoFilter === j ? 'text-accent' : 'text-accent/70 hover:text-accent'}`}>{j}</span>
                        ))}
                      </div>
                    )}
                  </div>
 
                  {/* Social links */}
                  <div className="flex items-center gap-1.5">
                    {a.soundcloud && <a href={a.soundcloud.startsWith('http') ? a.soundcloud : `https://${a.soundcloud}`} target="_blank" className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center text-xs hover:bg-orange-500/20 transition" title="SoundCloud">☁️</a>}
                    {a.instagram && <a href={`https://instagram.com/${a.instagram.replace('@','')}`} target="_blank" className="w-7 h-7 rounded-md bg-pink-500/10 flex items-center justify-center text-xs hover:bg-pink-500/20 transition" title="Instagram">📸</a>}
                    {a.spotify && <a href={a.spotify.startsWith('http') ? a.spotify : `https://${a.spotify}`} target="_blank" className="w-7 h-7 rounded-md bg-green-500/10 flex items-center justify-center text-xs hover:bg-green-500/20 transition" title="Spotify">🎧</a>}
                  </div>
                </div>
 
                {/* Contact button */}
                <button className="w-full mt-3 text-xs py-2.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition">
                  📩 Contacter {a.nom_scene}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
