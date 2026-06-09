'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ARTIST_TYPES, ARTIST_STYLES, JOURS, ARTIST_EMOJIS } from '@/lib/constants';

export default function OnboardingArtiste() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [nomScene, setNomScene] = useState('');
  const [ville, setVille] = useState('');
  const [typeArtiste, setTypeArtiste] = useState('');
  const [styles, setStyles] = useState([]);
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [spotify, setSpotify] = useState('');
  const [dispos, setDispos] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
    });
  }, []);

  const toggleStyle = (s) => setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleDispo = (j) => setDispos(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!nomScene || !ville || !typeArtiste) return;
    setLoading(true);

    let photoUrl = '';
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${user.id}/photo.${ext}`;
      await supabase.storage.from('photos').upload(path, photoFile, { upsert: true });
      const { data } = supabase.storage.from('photos').getPublicUrl(path);
      photoUrl = data.publicUrl;
    }

    await supabase.from('artistes').upsert({
      id: user.id,
      nom_scene: nomScene,
      ville,
      type_artiste: typeArtiste,
      styles,
      bio,
      photo_url: photoUrl,
      soundcloud, instagram, tiktok, youtube, spotify,
      disponibilites: dispos,
    });

    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id);

    router.push('/profil');
  };

  const availableStyles = ARTIST_STYLES[typeArtiste] || [];

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-lg mx-auto animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎧</div>
          <h1 className="font-display text-2xl font-bold">Créez votre profil artiste</h1>
          <p className="text-sm text-dim mt-1">Étape {step}/2 — {step === 1 ? 'Vos infos' : 'Dispos & liens'}</p>
          <div className="h-1 bg-bg-card rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${step * 50}%` }} />
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6">
          {step === 1 && (
            <div className="space-y-5">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <label className="relative cursor-pointer group">
                  <div className="w-20 h-20 rounded-full bg-bg-mid border-2 border-dashed border-border group-hover:border-accent/40 transition flex items-center justify-center overflow-hidden">
                    {photoPreview
                      ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                      : <span className="text-2xl text-dim">📷</span>
                    }
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </label>
                <div>
                  <div className="text-sm font-semibold">Photo de profil</div>
                  <div className="text-xs text-dim mt-0.5">Visage ou photo de scène</div>
                </div>
              </div>

              {/* Nom + Ville */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Nom de scène *</label>
                  <input value={nomScene} onChange={(e) => setNomScene(e.target.value)} required
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent transition"
                    placeholder="Ex : DJ Milo" />
                </div>
                <div>
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Ville *</label>
                  <input value={ville} onChange={(e) => setVille(e.target.value)} required
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent transition"
                    placeholder="Ex : Cannes" />
                </div>
              </div>

              {/* Type artiste */}
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Type d'artiste *</label>
                <div className="flex flex-wrap gap-2">
                  {ARTIST_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => { setTypeArtiste(t); setStyles([]); }}
                      className={`chip ${typeArtiste === t ? 'active' : ''}`}>
                      {ARTIST_EMOJIS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Styles (dynamic) */}
              {availableStyles.length > 0 && (
                <div className="animate-fade-up">
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Styles — {typeArtiste}</label>
                  <div className="flex flex-wrap gap-2">
                    {availableStyles.map(s => (
                      <button key={s} type="button" onClick={() => toggleStyle(s)}
                        className={`chip text-xs ${styles.includes(s) ? 'active' : ''}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-dim mt-2 flex items-center gap-1">ℹ️ Les établissements filtrent par genre</p>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Bio courte</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-accent transition resize-none"
                  placeholder="Présentez-vous en quelques mots..." />
              </div>

              <button onClick={() => setStep(2)} disabled={!nomScene || !ville || !typeArtiste}
                className="w-full bg-accent text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-accent/25 transition disabled:opacity-30 disabled:cursor-not-allowed">
                Suivant
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Disponibilités */}
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Disponibilités</label>
                <div className="grid grid-cols-7 gap-2">
                  {JOURS.map(j => (
                    <button key={j} type="button" onClick={() => toggleDispo(j)}
                      className={`py-3 rounded-lg text-center text-xs font-medium transition ${
                        dispos.includes(j)
                          ? 'bg-accent/10 border border-accent/30 text-accent'
                          : 'bg-bg-mid border border-border text-dim hover:border-dim'
                      }`}>
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              {/* SoundCloud */}
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Lien mix / démo</label>
                <div className="flex bg-bg-mid border border-border rounded-lg overflow-hidden focus-within:border-accent transition">
                  <div className="px-3 py-2.5 border-r border-border flex items-center bg-orange-500/5">
                    <span className="text-orange-500 text-sm">☁️</span>
                  </div>
                  <input value={soundcloud} onChange={(e) => setSoundcloud(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                    placeholder="soundcloud.com/ton-profil" />
                </div>
              </div>

              {/* Social links */}
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Réseaux sociaux</label>
                <div className="space-y-2">
                  {[
                    { key: 'instagram', val: instagram, set: setInstagram, icon: '📸', color: 'bg-pink-500/5', placeholder: '@ton_pseudo' },
                    { key: 'tiktok', val: tiktok, set: setTiktok, icon: '🎵', color: 'bg-white/5', placeholder: '@ton_pseudo' },
                    { key: 'youtube', val: youtube, set: setYoutube, icon: '▶️', color: 'bg-red-500/5', placeholder: 'youtube.com/@ta-chaine' },
                    { key: 'spotify', val: spotify, set: setSpotify, icon: '🎧', color: 'bg-green-500/5', placeholder: 'open.spotify.com/artist/...' },
                  ].map(s => (
                    <div key={s.key} className="flex bg-bg-mid border border-border rounded-lg overflow-hidden focus-within:border-accent transition">
                      <div className={`px-3 py-2.5 border-r border-border flex items-center ${s.color}`}>
                        <span className="text-sm">{s.icon}</span>
                      </div>
                      <input value={s.val} onChange={(e) => s.set(e.target.value)}
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                        placeholder={s.placeholder} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-dim mt-2 flex items-center gap-1">ℹ️ Tous optionnels — au moins un aide à crédibiliser votre profil</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-border text-sm text-muted hover:bg-bg-hover transition">
                  Retour
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-accent text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-accent/25 transition disabled:opacity-50">
                  {loading ? 'Publication...' : '✨ Publier mon profil'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
