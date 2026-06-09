'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ARTIST_TYPES, ARTIST_EMOJIS } from '@/lib/constants';

export default function Explorer() {
  const [artistes, setArtistes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase.from('artistes').select('*').order('created_at', { ascending: false });
      if (filter) query = query.eq('type_artiste', filter);
      const { data } = await query;
      setArtistes(data || []);
      setLoading(false);
    }
    load();
  }, [filter]);

  const filtered = artistes.filter(a =>
    !search || a.nom_scene.toLowerCase().includes(search.toLowerCase()) ||
    a.ville.toLowerCase().includes(search.toLowerCase()) ||
    a.styles?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="font-display text-3xl font-bold">Explorer les artistes</h1>
          <p className="text-sm text-muted mt-2">Trouvez l'artiste idéal pour votre prochaine soirée</p>
        </div>

        {/* Search + Filters */}
        <div className="mb-8 space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim">🔍</span>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:border-accent transition"
              placeholder="Rechercher par nom, ville ou style..."
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilter('')}
              className={`chip whitespace-nowrap ${!filter ? 'active' : ''}`}>Tous</button>
            {ARTIST_TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`chip whitespace-nowrap ${filter === t ? 'active' : ''}`}>
                {ARTIST_EMOJIS[t]} {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-up">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="font-display text-lg font-semibold mb-2">Aucun artiste trouvé</h3>
            <p className="text-sm text-muted">Essayez avec d'autres filtres</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((a, i) => (
              <div key={a.id} className="bg-bg-card border border-border rounded-2xl p-5 hover:border-accent/20 hover:-translate-y-0.5 transition animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {a.photo_url
                      ? <img src={a.photo_url} alt="" className="w-full h-full object-cover" />
                      : ARTIST_EMOJIS[a.type_artiste] || '🎵'
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-lg">{a.nom_scene}</h3>
                    <p className="text-xs text-accent font-medium">{a.type_artiste} · {a.ville}</p>
                    {a.bio && <p className="text-xs text-muted mt-2 line-clamp-2">{a.bio}</p>}
                    {a.styles?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.styles.slice(0, 4).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/15">{s}</span>
                        ))}
                        {a.styles.length > 4 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-hover text-dim">+{a.styles.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {a.disponibilites?.length > 0 && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-dim">Dispo :</span>
                    {a.disponibilites.map(j => (
                      <span key={j} className="text-xs text-accent">{j}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
