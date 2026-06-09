'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { VENUE_TYPES, AMBIANCES, EQUIPEMENTS } from '@/lib/constants';

export default function OnboardingEtablissement() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [siteWeb, setSiteWeb] = useState('');
  const [telephone, setTelephone] = useState('');
  const [horaires, setHoraires] = useState('');
  const [types, setTypes] = useState([]);
  const [ambiances, setAmbiances] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [capacite, setCapacite] = useState(50);
  const [contactNom, setContactNom] = useState('');
  const [contactTel, setContactTel] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
    });
  }, []);

  const toggleArr = (arr, setArr, v) => setArr(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!nom || !ville) return;
    setLoading(true);

    // Upload photos
    const photoUrls = [];
    for (let i = 0; i < photos.length; i++) {
      const ext = photos[i].name.split('.').pop();
      const path = `${user.id}/venue-${i}.${ext}`;
      await supabase.storage.from('photos').upload(path, photos[i], { upsert: true });
      const { data } = supabase.storage.from('photos').getPublicUrl(path);
      photoUrls.push(data.publicUrl);
    }

    await supabase.from('etablissements').upsert({
      id: user.id,
      nom, adresse, ville, site_web: siteWeb, telephone, horaires,
      type_etablissement: types,
      ambiances, equipements, capacite,
      contact_nom: contactNom, contact_tel: contactTel,
      photos: photoUrls,
    });

    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user.id);
    router.push('/profil');
  };

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-lg mx-auto animate-fade-up">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🍸</div>
          <h1 className="font-display text-2xl font-bold">Inscrivez votre établissement</h1>
          <p className="text-sm text-dim mt-1">Étape {step}/2 — {step === 1 ? 'Infos du lieu' : 'Ambiance & équipement'}</p>
          <div className="h-1 bg-bg-card rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue rounded-full transition-all" style={{ width: `${step * 50}%` }} />
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              {/* Photos */}
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Photos du lieu</label>
                <div className="flex gap-2 flex-wrap">
                  {photoPreviews.map((p, i) => (
                    <div key={i} className="relative w-20 h-16 rounded-lg overflow-hidden border border-border">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-4 h-4 bg-black/70 rounded-full text-red-400 text-[10px] flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  <label className="w-20 h-16 rounded-lg border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-blue/40 transition">
                    <span className="text-lg text-dim">+</span>
                    <span className="text-[9px] text-dim">Ajouter</span>
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Nom *</label>
                  <input value={nom} onChange={(e) => setNom(e.target.value)} required
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                    placeholder="Le Zinc" />
                </div>
                <div>
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Ville *</label>
                  <input value={ville} onChange={(e) => setVille(e.target.value)} required
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                    placeholder="Cannes" />
                </div>
              </div>

              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Adresse</label>
                <input value={adresse} onChange={(e) => setAdresse(e.target.value)}
                  className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                  placeholder="12 rue d'Antibes, 06400 Cannes" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Site internet</label>
                  <input value={siteWeb} onChange={(e) => setSiteWeb(e.target.value)}
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                    placeholder="www.lezinc.fr" />
                </div>
                <div>
                  <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Téléphone</label>
                  <input value={telephone} onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                    placeholder="04 93 XX XX XX" />
                </div>
              </div>

              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Contact interne</label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={contactNom} onChange={(e) => setContactNom(e.target.value)}
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                    placeholder="Nom & prénom" />
                  <input value={contactTel} onChange={(e) => setContactTel(e.target.value)}
                    className="w-full bg-bg-mid border border-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-blue transition"
                    placeholder="06 XX XX XX XX" />
                </div>
                <p className="text-xs text-dim mt-1.5 flex items-center gap-1">🔒 Visible uniquement par l'équipe Setly</p>
              </div>

              <button onClick={() => setStep(2)} disabled={!nom || !ville}
                className="w-full bg-blue text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue/25 transition disabled:opacity-30">
                Suivant
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Type d'établissement</label>
                <div className="flex flex-wrap gap-2">
                  {VENUE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => toggleArr(types, setTypes, t)}
                      className={`chip ${types.includes(t) ? 'active-blue' : ''}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Ambiances recherchées</label>
                <div className="flex flex-wrap gap-2">
                  {AMBIANCES.map(a => (
                    <button key={a} type="button" onClick={() => toggleArr(ambiances, setAmbiances, a)}
                      className={`chip ${ambiances.includes(a) ? 'active-blue' : ''}`}>{a}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Capacité : {capacite} pers.</label>
                <input type="range" min="10" max="500" step="10" value={capacite}
                  onChange={(e) => setCapacite(parseInt(e.target.value))}
                  className="w-full accent-blue-DEFAULT" />
              </div>

              <div>
                <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Équipement disponible</label>
                <div className="flex flex-wrap gap-2">
                  {EQUIPEMENTS.map(eq => (
                    <button key={eq.id} type="button" onClick={() => toggleArr(equipements, setEquipements, eq.id)}
                      className={`chip ${equipements.includes(eq.id) ? 'active-blue' : ''}`}>
                      {eq.icon} {eq.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-border text-sm text-muted hover:bg-bg-hover transition">
                  Retour
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-blue text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue/25 transition disabled:opacity-50">
                  {loading ? 'Publication...' : '🏆 Publier ma fiche'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
