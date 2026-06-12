'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { AMBIANCES } from '@/lib/constants';

function Calendar({selectedDates=[],onToggleDate,color='blue'}){const[vm,setVm]=useState(new Date());const y=vm.getFullYear(),m=vm.getMonth(),t=new Date();t.setHours(0,0,0,0);const dim=new Date(y,m+1,0).getDate(),fd=new Date(y,m,1).getDay(),adj=fd===0?6:fd-1;const mn=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];const dn=['Lu','Ma','Me','Je','Ve','Sa','Di'];const ds=(d)=>selectedDates.includes(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);const ip=(d)=>new Date(y,m,d)<t;const it=(d)=>y===t.getFullYear()&&m===t.getMonth()&&d===t.getDate();const hc=(d)=>{if(!ip(d))onToggleDate(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);};const ab='bg-blue',abr='border-blue/30',at='text-blue';return(<div className="bg-bg border border-border rounded-xl p-4"><div className="flex items-center justify-between mb-3"><button onClick={()=>setVm(new Date(y,m-1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">←</button><div className="text-sm font-semibold">{mn[m]} {y}</div><button onClick={()=>setVm(new Date(y,m+1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">→</button></div><div className="grid grid-cols-7 gap-1 mb-1">{dn.map(d=>(<div key={d} className="text-center text-[10px] text-dim font-medium py-1">{d}</div>))}</div><div className="grid grid-cols-7 gap-1">{Array.from({length:adj}).map((_,i)=>(<div key={`e${i}`}/>))}{Array.from({length:dim}).map((_,i)=>{const d=i+1,s=ds(d),p=ip(d),td=it(d);return(<button key={d} onClick={()=>hc(d)} disabled={p} className={`h-9 rounded-lg text-xs font-medium transition ${p?'text-dim/30 cursor-not-allowed':'cursor-pointer hover:bg-bg-card'} ${s&&!p?`${ab} text-black font-bold`:''} ${td&&!s?`border ${abr} ${at}`:''} ${!s&&!p&&!td?'text-muted':''}`}>{d}</button>);})}</div></div>);}

const MOYENS_PAIEMENT = ['Espèces', 'Virement bancaire', 'PayPal', 'Chèque', 'Lydia / Paylib', 'À discuter'];

export default function CreerSoiree() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [titre, setTitre] = useState('');
  const [dateSoiree, setDateSoiree] = useState([]);
  const [heureDebut, setHeureDebut] = useState('20:00');
  const [heureFin, setHeureFin] = useState('23:00');
  const [ambiance, setAmbiance] = useState('');
  const [description, setDescription] = useState('');
  const [cachet, setCachet] = useState('');
  const [moyenPaiement, setMoyenPaiement] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { supabase.auth.getUser().then(({ data: { user } }) => { if (!user) router.push('/login'); else setUser(user); }); }, []);

  const toggleDate = (d) => setDateSoiree(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d]);
  const formatD = (d) => { const[y,m,day]=d.split('-'); const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc']; return `${parseInt(day)} ${mn[parseInt(m)-1]} ${y}`; };

  const handleSubmit = async () => {
    if (!titre || dateSoiree.length === 0) return;
    setLoading(true);
    for (const date of dateSoiree) {
      await supabase.from('soirees').insert({
        etablissement_id: user.id, titre, date_soiree: date,
        heure_debut: heureDebut, heure_fin: heureFin,
        ambiance, description, status: 'draft',
        cachet: cachet ? parseInt(cachet) : null,
        moyen_paiement: moyenPaiement || null,
      });
    }
    setSuccess(true);
    setTimeout(() => router.push('/profil'), 2000);
  };

  if (success) return (<div className="min-h-screen flex items-center justify-center px-4"><div className="text-center animate-fade-up"><div className="text-5xl mb-4">🎉</div><h2 className="font-display text-xl font-bold mb-2">{dateSoiree.length > 1 ? `${dateSoiree.length} soirées créées !` : 'Soirée créée !'}</h2><p className="text-sm text-muted">Redirection...</p></div></div>);

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-lg mx-auto animate-fade-up">
        <div className="text-center mb-8"><div className="text-4xl mb-2">🎵</div><h1 className="font-display text-2xl font-bold">Créer une soirée</h1><p className="text-sm text-dim mt-1">Planifiez votre événement et trouvez un artiste</p></div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
          <div><label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Nom de la soirée *</label><input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-blue transition" placeholder="Ex : Soirée Jazz Terrasse" /></div>

          <div><label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Date(s) *</label><Calendar selectedDates={dateSoiree} onToggleDate={toggleDate} />{dateSoiree.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{dateSoiree.sort().map(d => (<span key={d} className="text-xs px-3 py-1 rounded-full bg-blue/10 border border-blue/20 text-blue flex items-center gap-1.5">{formatD(d)} <button onClick={() => toggleDate(d)} className="hover:text-white">✕</button></span>))}</div>}</div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Début</label><input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-blue transition" /></div>
            <div><label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Fin</label><input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-blue transition" /></div>
          </div>

          <div><label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Ambiance recherchée</label><div className="flex flex-wrap gap-2">{AMBIANCES.map(a => (<button key={a} onClick={() => setAmbiance(ambiance === a ? '' : a)} className={`chip ${ambiance === a ? 'active-blue' : ''}`}>{a}</button>))}</div></div>

          {/* CACHET */}
          <div className="bg-blue/5 border border-blue/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2"><span className="text-blue">💰</span><span className="text-sm font-medium text-blue">Rémunération artiste</span></div>
            <div>
              <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Cachet proposé (€)</label>
              <div className="relative">
                <input type="number" value={cachet} onChange={(e) => setCachet(e.target.value)} className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-blue transition pr-10" placeholder="Ex : 150" min="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dim text-sm">€</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-2">Moyen de paiement</label>
              <div className="flex flex-wrap gap-2">
                {MOYENS_PAIEMENT.map(mp => (
                  <button key={mp} onClick={() => setMoyenPaiement(moyenPaiement === mp ? '' : mp)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${moyenPaiement === mp ? 'bg-blue/15 border-blue/30 text-blue font-medium' : 'bg-bg-mid border-border text-dim hover:border-dim'}`}>{mp}</button>
                ))}
              </div>
            </div>
          </div>

          <div><label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Description (optionnel)</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-blue transition resize-none" placeholder="Décrivez l'ambiance, le public..." /></div>

          <div className="flex gap-3">
            <Link href="/profil" className="px-6 py-3 rounded-xl border border-border text-sm text-muted hover:bg-bg-hover transition text-center">Annuler</Link>
            <button onClick={handleSubmit} disabled={loading || !titre || dateSoiree.length === 0} className="flex-1 bg-blue text-black font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-blue/25 transition disabled:opacity-30">
              {loading ? 'Création...' : `🎵 Créer ${dateSoiree.length > 1 ? dateSoiree.length + ' soirées' : 'la soirée'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
