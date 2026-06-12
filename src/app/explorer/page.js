'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_TYPES, ARTIST_STYLES, ARTIST_EMOJIS, VENUE_TYPES, AMBIANCES, EQUIPEMENTS } from '@/lib/constants';
 
function Calendar({selectedDates=[],onToggleDate,color='accent'}){const[vm,setVm]=useState(new Date());const y=vm.getFullYear(),m=vm.getMonth(),t=new Date();t.setHours(0,0,0,0);const dim=new Date(y,m+1,0).getDate(),fd=new Date(y,m,1).getDay(),adj=fd===0?6:fd-1;const mn=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];const dn=['Lu','Ma','Me','Je','Ve','Sa','Di'];const ds=(d)=>selectedDates.includes(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);const ip=(d)=>new Date(y,m,d)<t;const it=(d)=>y===t.getFullYear()&&m===t.getMonth()&&d===t.getDate();const hc=(d)=>{if(!ip(d))onToggleDate(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);};const ab=color==='blue'?'bg-blue':'bg-accent',abr=color==='blue'?'border-blue/30':'border-accent/30',at=color==='blue'?'text-blue':'text-accent';return(<div className="bg-bg border border-border rounded-xl p-4"><div className="flex items-center justify-between mb-3"><button onClick={()=>setVm(new Date(y,m-1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">←</button><div className="text-sm font-semibold">{mn[m]} {y}</div><button onClick={()=>setVm(new Date(y,m+1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">→</button></div><div className="grid grid-cols-7 gap-1 mb-1">{dn.map(d=>(<div key={d} className="text-center text-[10px] text-dim font-medium py-1">{d}</div>))}</div><div className="grid grid-cols-7 gap-1">{Array.from({length:adj}).map((_,i)=>(<div key={`e${i}`}/>))}{Array.from({length:dim}).map((_,i)=>{const d=i+1,s=ds(d),p=ip(d),td=it(d);return(<button key={d} onClick={()=>hc(d)} disabled={p} className={`h-9 rounded-lg text-xs font-medium transition ${p?'text-dim/30 cursor-not-allowed':'cursor-pointer hover:bg-bg-card'} ${s&&!p?`${ab} text-black font-bold`:''} ${td&&!s?`border ${abr} ${at}`:''} ${!s&&!p&&!td?'text-muted':''}`}>{d}</button>);})}</div><div className="flex items-center gap-4 mt-3 pt-3 border-t border-border"><div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${ab}`}></div><span className="text-[10px] text-dim">Sélectionné</span></div>{selectedDates.length>0&&<span className={`text-[10px] ${at} ml-auto font-medium`}>{selectedDates.length} date{selectedDates.length>1?'s':''}</span>}</div></div>);}
 
export default function Explorer() {
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dispoFilter, setDispoFilter] = useState('');
  const [dateFilter, setDateFilter] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [mySoirees, setMySoirees] = useState([]);
  const [myDemandes, setMyDemandes] = useState([]);
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      let role = 'etablissement';
      if (user) {
        setUserId(user.id);
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (prof) role = prof.role;
 
        // Load venue's draft soirées for propose feature
        if (role === 'etablissement') {
          const { data: soirs } = await supabase.from('soirees').select('id, titre, date_soiree, heure_debut, heure_fin, ambiance, cachet, moyen_paiement').eq('etablissement_id', user.id).eq('status', 'draft').order('date_soiree', { ascending: true });
          setMySoirees(soirs || []);
        }
      }
      setUserRole(role);
 
      if (role === 'artiste') {
        const { data } = await supabase.from('etablissements').select('*').order('created_at', { ascending: false });
        setItems(data || []);
      } else {
        let query = supabase.from('artistes').select('*').order('created_at', { ascending: false });
        if (typeFilter) query = query.eq('type_artiste', typeFilter);
        const { data } = await query;
        setItems(data || []);
      }
      setLoading(false);
    }
    setLoading(true); load();
  }, [typeFilter]);
 
  const toggleDate = (d) => setDateFilter(prev => prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);
  const formatDate = (d) => { const[y,m,day]=d.split('-');const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return`${parseInt(day)} ${mn[parseInt(m)-1]}`; };
  const isArtistView = userRole === 'etablissement' || userRole === null;
 
  const filtered = items.filter(item => {
    if (isArtistView) {
      if (search) { const q=search.toLowerCase(); if(!(item.nom_scene?.toLowerCase().includes(q)||item.ville?.toLowerCase().includes(q)||item.styles?.some(s=>s.toLowerCase().includes(q))||item.type_artiste?.toLowerCase().includes(q)||item.bio?.toLowerCase().includes(q))) return false; }
      if (styleFilter && !item.styles?.includes(styleFilter)) return false;
      if (villeFilter && !item.ville?.toLowerCase().includes(villeFilter.toLowerCase())) return false;
      if (dispoFilter && !item.disponibilites?.includes(dispoFilter)) return false;
      if (dateFilter.length > 0 && !dateFilter.some(d => item.dates_dispo?.includes(d))) return false;
    } else {
      if (search) { const q=search.toLowerCase(); if(!(item.nom?.toLowerCase().includes(q)||item.ville?.toLowerCase().includes(q)||item.ambiances?.some(a=>a.toLowerCase().includes(q))||item.type_etablissement?.some(t=>t.toLowerCase().includes(q)))) return false; }
      if (typeFilter && !item.type_etablissement?.includes(typeFilter)) return false;
      if (villeFilter && !item.ville?.toLowerCase().includes(villeFilter.toLowerCase())) return false;
    }
    return true;
  });
 
  const allVilles = [...new Set(items.map(a => a.ville).filter(Boolean))];
  const availableStyles = isArtistView ? (typeFilter ? (ARTIST_STYLES[typeFilter] || []) : [...new Set(items.flatMap(a => a.styles || []))]) : [];
 
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">{isArtistView ? 'Explorer les artistes' : 'Explorer les établissements'}</h1>
          <p className="text-sm text-muted mt-2">{isArtistView ? "Trouvez l'artiste idéal pour votre prochaine soirée" : 'Trouvez des lieux où jouer près de chez vous'}</p>
        </div>
 
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg">🔍</span><input value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-bg-card border border-border rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:border-accent transition placeholder:text-dim" placeholder={isArtistView?'Rechercher par nom, ville, style...':'Rechercher par nom, ville, ambiance...'} />{search&&<button onClick={()=>setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-dim hover:text-muted text-sm">✕</button>}</div></div>
 
        <div className="mb-4 animate-fade-up" style={{animationDelay:'0.1s'}}><div className="flex gap-2 overflow-x-auto pb-1"><button onClick={()=>{setTypeFilter('');setStyleFilter('');}} className={`chip whitespace-nowrap flex-shrink-0 ${!typeFilter?'active':''}`}>Tous</button>{isArtistView?ARTIST_TYPES.map(t=>(<button key={t} onClick={()=>{setTypeFilter(t);setStyleFilter('');}} className={`chip whitespace-nowrap flex-shrink-0 ${typeFilter===t?'active':''}`}>{ARTIST_EMOJIS[t]} {t}</button>)):VENUE_TYPES.map(t=>(<button key={t} onClick={()=>setTypeFilter(t)} className={`chip whitespace-nowrap flex-shrink-0 ${typeFilter===t?'active':''}`}>{t}</button>))}</div></div>
 
        {isArtistView&&availableStyles.length>0&&<div className="mb-4 animate-fade-up" style={{animationDelay:'0.12s'}}><div className="flex gap-2 overflow-x-auto pb-1"><button onClick={()=>setStyleFilter('')} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition ${!styleFilter?'bg-accent/10 border-accent/30 text-accent font-medium':'bg-bg-card border-border text-dim hover:border-dim'}`}>Tous les styles</button>{availableStyles.slice(0,12).map(s=>(<button key={s} onClick={()=>setStyleFilter(styleFilter===s?'':s)} className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition ${styleFilter===s?'bg-accent/10 border-accent/30 text-accent font-medium':'bg-bg-card border-border text-dim hover:border-dim'}`}>{s}</button>))}</div></div>}
 
        <div className="flex flex-wrap gap-3 mb-4 animate-fade-up" style={{animationDelay:'0.14s'}}>
          {isArtistView&&<button onClick={()=>setShowCalendar(!showCalendar)} className={`text-xs px-4 py-2 rounded-lg border flex items-center gap-2 transition ${dateFilter.length>0||showCalendar?'bg-accent/10 border-accent/30 text-accent font-medium':'bg-bg-card border-border text-muted hover:border-dim'}`}>📅 {dateFilter.length>0?`${dateFilter.length} date${dateFilter.length>1?'s':''}`:'Filtrer par date'}</button>}
          {allVilles.length>1&&<select value={villeFilter} onChange={(e)=>setVilleFilter(e.target.value)} className="bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted focus:border-accent transition appearance-none cursor-pointer"><option value="">Toutes les villes</option>{allVilles.map(v=>(<option key={v} value={v}>{v}</option>))}</select>}
          {isArtistView&&<select value={dispoFilter} onChange={(e)=>setDispoFilter(e.target.value)} className="bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-muted focus:border-accent transition appearance-none cursor-pointer"><option value="">Tous les jours</option>{['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j=>(<option key={j} value={j}>{j}</option>))}</select>}
          {(search||styleFilter||villeFilter||dispoFilter||dateFilter.length>0||typeFilter)&&<button onClick={()=>{setSearch('');setStyleFilter('');setVilleFilter('');setDispoFilter('');setDateFilter([]);setShowCalendar(false);setTypeFilter('');}} className="text-xs text-accent hover:underline flex-shrink-0">Réinitialiser</button>}
        </div>
 
        {dateFilter.length>0&&<div className="flex flex-wrap gap-2 mb-4">{dateFilter.sort().map(d=>(<span key={d} className="text-xs px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center gap-1.5">{formatDate(d)}<button onClick={()=>toggleDate(d)} className="hover:text-white">✕</button></span>))}</div>}
        {showCalendar&&<div className="mb-5 max-w-sm animate-fade-up"><Calendar selectedDates={dateFilter} onToggleDate={toggleDate} color="accent"/></div>}
 
        <div className="flex items-center justify-between mb-4"><span className="text-xs text-dim">{loading?'Chargement...':`${filtered.length} résultat${filtered.length!==1?'s':''}`}</span></div>
 
        {loading?<div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin"/></div>:
        filtered.length===0?<div className="text-center py-20 animate-fade-up"><div className="text-5xl mb-4">{isArtistView?'🎵':'🏪'}</div><h3 className="font-display text-lg font-semibold mb-2">Aucun résultat</h3><button onClick={()=>{setSearch('');setTypeFilter('');setStyleFilter('');setVilleFilter('');setDispoFilter('');setDateFilter([]);}} className="text-sm text-accent hover:underline">Tout afficher</button></div>:
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((item, i) => isArtistView
            ? <ArtistCard key={item.id} a={item} i={i} styleFilter={styleFilter} setStyleFilter={setStyleFilter} dateFilter={dateFilter} soirees={mySoirees} supabase={supabase} userId={userId} existingDemandes={myDemandes} setMyDemandes={setMyDemandes} />
            : <VenueCard key={item.id} v={item} i={i} />
          )}
        </div>}
      </div>
    </div>
  );
}
 
function ArtistCard({ a, i, styleFilter, setStyleFilter, dateFilter, soirees, supabase, userId, existingDemandes, setMyDemandes }) {
  const [showPropose, setShowPropose] = useState(false);
  const [proposeSent, setProposeSent] = useState(false);
  const [selectedSoiree, setSelectedSoiree] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
 
  const sendDemande = async () => {
    if (!selectedSoiree) return;
    setSending(true);
    await supabase.from('demandes').insert({ soiree_id: selectedSoiree, etablissement_id: userId, artiste_id: a.id, status: 'pending', message: message.trim() || null });
    setSending(false); setProposeSent(true); setShowPropose(false); setMessage(''); setSelectedSoiree(null);
    setTimeout(() => setProposeSent(false), 4000);
    if(setMyDemandes) setMyDemandes(prev => [...prev, { soiree_id: selectedSoiree, artiste_id: a.id, status: "pending" }]);
  };
 
  const formatD = (d) => { if(!d)return''; const dt=new Date(d+'T00:00:00'); const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc']; return `${dt.getDate()} ${mn[dt.getMonth()]}`; };
 
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-5 hover:border-accent/20 transition animate-fade-up" style={{animationDelay:`${Math.min(i*0.05,0.5)}s`}}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden border border-accent/10">{a.photo_url?<img src={a.photo_url} alt={a.nom_scene} className="w-full h-full object-cover"/>:ARTIST_EMOJIS[a.type_artiste]||'🎵'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg leading-tight">{a.nom_scene}</h3>
          <p className="text-xs text-accent font-medium mt-0.5">{a.type_artiste} · {a.ville}</p>
          {a.bio&&<p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">{a.bio}</p>}
          {a.styles?.length>0&&<div className="flex flex-wrap gap-1.5 mt-2.5">{a.styles.slice(0,5).map(s=>(<span key={s} onClick={()=>setStyleFilter(s)} className={`text-[10px] px-2.5 py-0.5 rounded-full cursor-pointer transition ${styleFilter===s?'bg-accent/20 border border-accent/40 text-accent font-medium':'bg-accent/10 border border-accent/15 text-accent hover:bg-accent/15'}`}>{s}</span>))}</div>}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-3">
          {a.disponibilites?.length>0&&<div className="flex items-center gap-1.5"><span className="text-[10px] text-dim">Jours :</span>{a.disponibilites.map(j=>(<span key={j} className="text-[10px] text-accent/70 font-medium">{j}</span>))}</div>}
          {dateFilter.length>0&&a.dates_dispo?.some(d=>dateFilter.includes(d))&&<span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">✓ Dispo</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {a.soundcloud&&<a href={a.soundcloud.startsWith('http')?a.soundcloud:`https://${a.soundcloud}`} target="_blank" className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center text-xs hover:bg-orange-500/20 transition">☁️</a>}
          {a.instagram&&<a href={`https://instagram.com/${a.instagram.replace('@','')}`} target="_blank" className="w-7 h-7 rounded-md bg-pink-500/10 flex items-center justify-center text-xs hover:bg-pink-500/20 transition">📸</a>}
        </div>
      </div>
 
      {/* ACTION BUTTONS */}
      <div className="flex gap-2 mt-3">
        <Link href={`/messages?to=${a.id}&name=${encodeURIComponent(a.nom_scene)}`} className="flex-1 text-xs py-2.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition text-center">📩 Contacter</Link>
        {availableSoirees.length > 0 && !proposeSent && !alreadyProposed && (
          <button onClick={() => setShowPropose(!showPropose)} className={`flex-1 text-xs py-2.5 rounded-lg border font-medium transition ${showPropose ? 'bg-blue/20 text-blue border-blue/30' : 'bg-blue/10 text-blue border-blue/20 hover:bg-blue/20'}`}>📋 Proposer une soirée</button>
        )}
        {proposeSent && <span className="flex-1 text-xs py-2.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 text-center">✓ Demande envoyée !</span>}
        {alreadyProposed && !proposeSent && <span className="flex-1 text-xs py-2.5 rounded-lg bg-dim/10 text-dim border border-border text-center">Demande déjà envoyée</span>}
      </div>
 
      {/* PROPOSE PANEL */}
      {showPropose && (
        <div className="mt-3 bg-bg border border-blue/20 rounded-xl p-4 animate-fade-up space-y-3">
          <div className="text-xs font-medium text-blue flex items-center gap-1.5">📋 Choisissez une soirée pour {a.nom_scene}</div>
          <div className="space-y-1.5">
            {availableSoirees.map(s => (
              <button key={s.id} onClick={() => setSelectedSoiree(s.id)}
                className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition ${selectedSoiree === s.id ? 'bg-blue/10 border-blue/30 text-blue' : 'border-border hover:bg-bg-card text-muted'}`}>
                <span className="font-medium">{s.titre}</span>
                <span className="text-dim ml-2">{formatD(s.date_soiree)} · {s.heure_debut}–{s.heure_fin}</span>
                {s.ambiance && <span className="text-dim ml-1">· {s.ambiance}</span>}{s.cachet && <span className="text-accent ml-1">· {s.cachet}€</span>}
              </button>
            ))}
          </div>
          <div>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message pour l'artiste (optionnel)" className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-white focus:border-blue transition placeholder:text-dim" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowPropose(false); setSelectedSoiree(null); setMessage(''); }} className="text-xs px-4 py-2 rounded-lg border border-border text-muted hover:text-white transition">Annuler</button>
            <button onClick={sendDemande} disabled={!selectedSoiree || sending} className="flex-1 text-xs py-2 rounded-lg bg-blue text-black font-medium disabled:opacity-30 transition">
              {sending ? 'Envoi...' : '📨 Envoyer la demande'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
 
function VenueCard({ v, i }) {
  const eqMap = {}; EQUIPEMENTS.forEach(e => { eqMap[e.id] = e; });
  return (
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden hover:border-blue/20 transition animate-fade-up" style={{animationDelay:`${Math.min(i*0.05,0.5)}s`}}>
      {v.photos?.length>0?<div className="h-32 overflow-hidden"><img src={v.photos[0]} alt={v.nom} className="w-full h-full object-cover"/></div>:<div className="h-24 bg-gradient-to-br from-blue/10 to-bg-mid"/>}
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg">{v.nom}</h3>
        <p className="text-xs text-dim mt-0.5 flex items-center gap-1">📍 {v.adresse||v.ville}</p>
        {v.capacite&&<p className="text-xs text-dim mt-0.5">Capacité {v.capacite} pers.</p>}
        {v.type_etablissement?.length>0&&<div className="flex flex-wrap gap-1.5 mt-3">{v.type_etablissement.map(t=>(<span key={t} className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{t}</span>))}</div>}
        {v.ambiances?.length>0&&<div className="flex flex-wrap gap-1.5 mt-2">{v.ambiances.map(a=>(<span key={a} className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{a}</span>))}</div>}
        <Link href={`/messages?to=${v.id}&name=${encodeURIComponent(v.nom)}`} className="w-full mt-3 text-xs py-2.5 rounded-lg bg-blue/10 text-blue border border-blue/20 font-medium hover:bg-blue/20 transition block text-center">📩 Contacter {v.nom}</Link>
      </div>
    </div>
  );
}
 
