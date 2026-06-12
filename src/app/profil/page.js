'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_EMOJIS } from '@/lib/constants';
 
function Calendar({selectedDates=[],onToggleDate,color='accent'}){const[vm,setVm]=useState(new Date());const y=vm.getFullYear(),m=vm.getMonth(),t=new Date();t.setHours(0,0,0,0);const dim=new Date(y,m+1,0).getDate(),fd=new Date(y,m,1).getDay(),adj=fd===0?6:fd-1;const mn=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];const dn=['Lu','Ma','Me','Je','Ve','Sa','Di'];const ds=(d)=>selectedDates.includes(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);const ip=(d)=>new Date(y,m,d)<t;const it=(d)=>y===t.getFullYear()&&m===t.getMonth()&&d===t.getDate();const hc=(d)=>{if(!ip(d))onToggleDate(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);};const ab=color==='blue'?'bg-blue':'bg-accent',abr=color==='blue'?'border-blue/30':'border-accent/30',at=color==='blue'?'text-blue':'text-accent';return(<div className="bg-bg border border-border rounded-xl p-4"><div className="flex items-center justify-between mb-3"><button onClick={()=>setVm(new Date(y,m-1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">←</button><div className="text-sm font-semibold">{mn[m]} {y}</div><button onClick={()=>setVm(new Date(y,m+1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">→</button></div><div className="grid grid-cols-7 gap-1 mb-1">{dn.map(d=>(<div key={d} className="text-center text-[10px] text-dim font-medium py-1">{d}</div>))}</div><div className="grid grid-cols-7 gap-1">{Array.from({length:adj}).map((_,i)=>(<div key={`e${i}`}/>))}{Array.from({length:dim}).map((_,i)=>{const d=i+1,s=ds(d),p=ip(d),td=it(d);return(<button key={d} onClick={()=>hc(d)} disabled={p} className={`h-9 rounded-lg text-xs font-medium transition ${p?'text-dim/30 cursor-not-allowed':'cursor-pointer hover:bg-bg-card'} ${s&&!p?`${ab} text-black font-bold`:''} ${td&&!s?`border ${abr} ${at}`:''} ${!s&&!p&&!td?'text-muted':''}`}>{d}</button>);})}</div><div className="flex items-center gap-4 mt-3 pt-3 border-t border-border"><div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${ab}`}></div><span className="text-[10px] text-dim">Sélectionné</span></div>{selectedDates.length>0&&<span className={`text-[10px] ${at} ml-auto font-medium`}>{selectedDates.length} date{selectedDates.length>1?'s':''}</span>}</div></div>);}
 
export default function Profil(){const[user,setUser]=useState(null);const[profile,setProfile]=useState(null);const[data,setData]=useState(null);const[loading,setLoading]=useState(true);const router=useRouter();const supabase=createClient();
useEffect(()=>{async function load(){const{data:{user}}=await supabase.auth.getUser();if(!user){router.push('/login');return;}setUser(user);const{data:prof}=await supabase.from('profiles').select('*').eq('id',user.id).single();setProfile(prof);if(prof?.role==='artiste'){const{data:art}=await supabase.from('artistes').select('*').eq('id',user.id).single();setData(art);}else{const{data:etab}=await supabase.from('etablissements').select('*').eq('id',user.id).single();setData(etab);}setLoading(false);}load();},[]);
if(loading)return<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin"/></div>;
if(!profile?.onboarding_done||!data)return(<div className="min-h-screen flex items-center justify-center px-4"><div className="text-center animate-fade-up"><div className="text-5xl mb-4">{profile?.role==='artiste'?'🎧':'🍸'}</div><h2 className="font-display text-xl font-bold mb-2">Profil incomplet</h2><Link href={`/onboarding/${profile?.role==='artiste'?'artiste':'etablissement'}`} className="bg-accent text-black font-bold px-6 py-3 rounded-xl inline-block">Compléter mon profil</Link></div></div>);
const isArtist=profile.role==='artiste';
function gc(){if(isArtist){const f=[data.nom_scene,data.ville,data.type_artiste,data.bio,data.photo_url,data.styles?.length>0,data.disponibilites?.length>0,data.soundcloud||data.instagram||data.spotify];return Math.round((f.filter(Boolean).length/f.length)*100);}const f=[data.nom,data.ville,data.adresse,data.type_etablissement?.length>0,data.ambiances?.length>0,data.equipements?.length>0,data.photos?.length>0,data.site_web,data.contact_nom];return Math.round((f.filter(Boolean).length/f.length)*100);}
if(isArtist)return<ArtistDashboard data={data} user={user} completion={gc()} supabase={supabase}/>;
return<VenueDashboard data={data} user={user} completion={gc()} supabase={supabase}/>;}
 
function ArtistDashboard({data,user,completion,supabase}){
  const[datesDispo,setDatesDispo]=useState(data.dates_dispo||[]);
  const[savingDates,setSavingDates]=useState(false);
  const[showCal,setShowCal]=useState(false);
  const[datesSaved,setDatesSaved]=useState(false);
  const[demandes,setDemandes]=useState([]);
  const[matchingSoirees,setMatchingSoirees]=useState([]);
  const[loadingData,setLoadingData]=useState(true);
 
  useEffect(()=>{
    async function loadAll(){
      // Load real demandes
      const{data:dems}=await supabase.from('demandes').select('*, soirees(*), etablissements:etablissement_id(nom, photos, ville)').eq('artiste_id',user.id).order('created_at',{ascending:false});
      setDemandes(dems||[]);
 
      // Load soirées matching artist dispos
      const artistDates = data.dates_dispo || [];
      if(artistDates.length > 0){
        const{data:allSoirees}=await supabase.from('soirees').select('*, etablissements:etablissement_id(nom, photos, ville, ambiances)').eq('status','draft').order('date_soiree',{ascending:true});
        const matching = (allSoirees||[]).filter(s => {
          // Match by date
          if(!artistDates.includes(s.date_soiree)) return false;
          // Exclude soirées already proposed to this artist
          return true;
        });
        // Filter out soirées where this artist already has a demande
        const demandesSoireeIds = (dems||[]).map(d => d.soiree_id);
        setMatchingSoirees(matching.filter(s => !demandesSoireeIds.includes(s.id)));
      }
      setLoadingData(false);
    }
    loadAll();
  },[]);
 
  const toggleDate=(d)=>{setDatesDispo(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);setDatesSaved(false);};
  const saveDates=async()=>{setSavingDates(true);await supabase.from('artistes').update({dates_dispo:datesDispo}).eq('id',user.id);setSavingDates(false);setDatesSaved(true);setTimeout(()=>setDatesSaved(false),3000);};
  const deleteDemande=async(id)=>{if(!confirm('Supprimer cette demande ?'))return;await supabase.from('demandes').delete().eq('id',id);setDemandes(prev=>prev.filter(d=>d.id!==id));};
  const handleDemande=async(demandeId,newStatus)=>{
    await supabase.from('demandes').update({status:newStatus}).eq('id',demandeId);
    if(newStatus==='accepted'){
      const dem=demandes.find(d=>d.id===demandeId);
      if(dem&&dem.soirees){
        const{count}=await supabase.from('demandes').select('*',{count:'exact',head:true}).eq('soiree_id',dem.soiree_id).eq('status','accepted');
        const needed=dem.soirees.nb_artistes||1;
        if((count||0)+1>=needed){
          await supabase.from('soirees').update({status:'confirmed'}).eq('id',dem.soiree_id);
        }
      }
    }
    setDemandes(prev=>prev.map(d=>d.id===demandeId?{...d,status:newStatus}:d));
  };
  const formatD=(d)=>{if(!d)return'';const dt=new Date(d+'T00:00:00');const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return`${dt.getDate()} ${mn[dt.getMonth()]} ${dt.getFullYear()}`;};
  const stMap={pending:{bg:'bg-accent/10 border-accent/20 text-accent',label:'Nouveau'},accepted:{bg:'bg-green-400/10 border-green-400/20 text-green-400',label:'Accepté'},declined:{bg:'bg-red-400/10 border-red-400/20 text-red-400',label:'Refusé'}};
  const accepted=demandes.filter(d=>d.status==='accepted');
  const pending=demandes.filter(d=>d.status==='pending');
 
  return(
    <div className="min-h-screen px-4 py-20"><div className="max-w-2xl mx-auto">
      {/* TOP BAR */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-bg-mid flex items-center justify-center text-xl overflow-hidden border-2 border-accent/20">{data.photo_url?<img src={data.photo_url} alt="" className="w-full h-full object-cover"/>:<span>{ARTIST_EMOJIS[data.type_artiste]||'🎵'}</span>}</div>
          <div><div className="font-display text-lg font-semibold">Salut, {data.nom_scene}</div><span className="inline-flex items-center gap-1 text-xs bg-accent/10 border border-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium">⚡ Ambassadeur</span></div>
        </div>
        <div className="flex gap-2"><Link href="/messages" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition">💬</Link><Link href="/onboarding/artiste" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition">⚙️</Link></div>
      </div>
 
      {/* STATS */}
      <div className="grid grid-cols-4 gap-3 mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-accent">{pending.length}</div><div className="text-[11px] text-dim mt-1">En attente</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-green-400">{accepted.length}</div><div className="text-[11px] text-dim mt-1">Acceptées</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-blue">{matchingSoirees.length}</div><div className="text-[11px] text-dim mt-1">Soirées dispo</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold">{datesDispo.length}</div><div className="text-[11px] text-dim mt-1">Dates dispo</div></div>
      </div>
 
      {/* MATCHING SOIREES */}
      {matchingSoirees.length > 0 && (
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.07s'}}>
          <div className="bg-accent/5 border border-accent/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><span className="text-accent">✨</span><span className="text-sm font-medium text-accent">Soirées qui correspondent à vos dispos</span></div>
            <div className="space-y-2">
              {matchingSoirees.slice(0, 5).map(s => (
                <div key={s.id} className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue/10 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">{s.etablissements?.photos?.[0]?<img src={s.etablissements.photos[0]} alt="" className="w-full h-full object-cover"/>:'🍸'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{s.titre}</div>
                    <div className="text-[11px] text-dim">{s.etablissements?.nom} · {s.etablissements?.ville}</div>
                    <div className="text-[10px] text-accent mt-0.5">📅 {formatD(s.date_soiree)} · {s.heure_debut}–{s.heure_fin}{s.cachet&&` · ${s.cachet}€`}{s.nb_artistes&&s.nb_artistes>1&&` · ${s.nb_artistes} artistes`} {s.ambiance && `· ${s.ambiance}`}</div>
                  </div>
                  <Link href={`/messages?to=${s.etablissement_id}&name=${encodeURIComponent(s.etablissements?.nom||'')}`} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition flex-shrink-0">Postuler</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
 
      {/* CALENDAR */}
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.09s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">📅 Mes disponibilités</h2><button onClick={()=>setShowCal(!showCal)} className="text-xs text-accent hover:underline">{showCal?'Masquer':'Gérer mes dates'}</button></div>
        {datesDispo.length>0&&!showCal&&<div className="flex flex-wrap gap-1.5 mb-2">{datesDispo.sort().slice(0,8).map(d=>(<span key={d} className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 border border-accent/15 text-accent flex items-center gap-1">{formatD(d)}<button onClick={async()=>{const nd=datesDispo.filter(x=>x!==d);setDatesDispo(nd);await supabase.from('artistes').update({dates_dispo:nd}).eq('id',user.id);}} className="hover:text-white">✕</button></span>))}{datesDispo.length>8&&<span className="text-[10px] px-2.5 py-1 rounded-full bg-bg-card text-dim">+{datesDispo.length-8}</span>}</div>}
        {datesDispo.length===0&&!showCal&&<p className="text-xs text-dim">Ajoutez vos dates pour voir les soirées disponibles</p>}
        {showCal&&(<div className="space-y-3 animate-fade-up"><Calendar selectedDates={datesDispo} onToggleDate={toggleDate} color="accent"/><div className="flex items-center gap-3"><button onClick={saveDates} disabled={savingDates} className="text-xs px-4 py-2 rounded-lg bg-accent text-black font-medium disabled:opacity-50">{savingDates?'...':'💾 Enregistrer'}</button>{datesSaved&&<span className="text-xs text-green-400">✓ Sauvegardé</span>}</div></div>)}
      </div>
 
      {/* DEMANDES */}
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.12s'}}>
        <h2 className="text-sm font-medium flex items-center gap-2 mb-3">📩 Demandes reçues {pending.length>0&&<span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{pending.length} nouvelle{pending.length>1?'s':''}</span>}</h2>
        {loadingData?<div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin"/></div>:
        demandes.length===0?<div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-3xl mb-2">📭</div><p className="text-xs text-dim">Aucune demande pour le moment</p></div>:
        <div className="space-y-2">{demandes.map(d=>{const st=stMap[d.status]||stMap.pending;const s=d.soirees;const e=d.etablissements;return(
          <div key={d.id} className="bg-bg border border-border rounded-xl p-4 hover:border-dim transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center text-lg overflow-hidden">{e?.photos?.[0]?<img src={e.photos[0]} alt="" className="w-full h-full object-cover"/>:'🍸'}</div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium">{e?.nom||'Établissement'}</div><div className="text-xs text-dim mt-0.5">{s?.titre} {s?.ambiance&&`· ${s.ambiance}`}</div></div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${st.bg}`}>{st.label}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-xs text-dim">📅 {formatD(s?.date_soiree)} · {s?.heure_debut}–{s?.heure_fin}{s?.cachet&&<span className="ml-2 text-accent">💰 {s.cachet}€{s.moyen_paiement&&` · ${s.moyen_paiement}`}</span>}</span>
              <div className="flex gap-2">
                {d.status==='pending'&&(<><button onClick={()=>handleDemande(d.id,'declined')} className="text-xs px-3 py-1.5 rounded-lg bg-bg-card border border-border text-muted hover:text-white transition">Refuser</button><button onClick={()=>handleDemande(d.id,'accepted')} className="text-xs px-3 py-1.5 rounded-lg bg-accent text-black font-medium">Accepter</button></>)}
                {d.status!=='pending'&&<Link href={`/messages?to=${d.etablissement_id}&name=${encodeURIComponent(e?.nom||'')}`} className="text-xs px-3 py-1.5 rounded-lg bg-blue/10 text-blue border border-blue/20">💬 Message</Link>}{d.status==='declined'&&<button onClick={()=>deleteDemande(d.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition">🗑️</button>}
              </div>
            </div>
            {d.message&&<div className="mt-2 text-xs text-dim italic">&quot;{d.message}&quot;</div>}
          </div>);})}</div>}
      </div>
 
      {/* UPCOMING */}
      {accepted.length>0&&<div className="mb-5 animate-fade-up" style={{animationDelay:'0.15s'}}><h2 className="text-sm font-medium flex items-center gap-2 mb-3">🎵 Prochaines soirées</h2><div className="space-y-2">{accepted.map(d=>{const s=d.soirees;const e=d.etablissements;const dt=s?.date_soiree?new Date(s.date_soiree+'T00:00:00'):null;return(<div key={d.id} className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4"><div className="text-center w-12 flex-shrink-0"><div className="text-lg font-semibold">{dt?.getDate()}</div><div className="text-[10px] text-dim uppercase">{dt?['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][dt.getMonth()]:''}</div></div><div className="flex-1 min-w-0"><div className="text-sm font-medium">{s?.titre}</div><div className="text-xs text-dim mt-0.5">{e?.nom}</div><div className="text-xs text-accent mt-1">🕐 {s?.heure_debut}–{s?.heure_fin}</div></div><span className="text-[10px] px-2.5 py-1 rounded-full font-medium border bg-green-400/10 border-green-400/20 text-green-400">Confirmé</span></div>);})}</div></div>}
 
      {/* PROFILE */}
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.2s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">👤 Mon profil</h2><Link href="/onboarding/artiste" className="text-xs text-dim hover:text-muted">Modifier</Link></div>
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-bg-mid flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 border-2 border-accent/15">{data.photo_url?<img src={data.photo_url} alt="" className="w-full h-full object-cover"/>:<span>{ARTIST_EMOJIS[data.type_artiste]||'🎵'}</span>}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{data.nom_scene}</div><div className="text-xs text-accent mt-0.5">{data.type_artiste} · {data.ville}</div>{data.styles?.length>0&&<div className="flex gap-1.5 mt-2 flex-wrap">{data.styles.slice(0,4).map(s=>(<span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/15 text-accent">{s}</span>))}</div>}</div>
          <div className="text-right flex-shrink-0"><div className={`text-lg font-semibold ${completion===100?'text-green-400':'text-accent'}`}>{completion}%</div><div className="text-[10px] text-dim">Complet</div></div>
        </div>
      </div>
      <BottomNav active="home" role="artiste"/>
    </div></div>
  );
}
 
function VenueDashboard({data,user,completion,supabase}){
  const[soirees,setSoirees]=useState([]);const[loadingSoirees,setLoadingSoirees]=useState(true);
  const deleteSoiree=async(id)=>{if(!confirm('Supprimer cette soirée ? Les demandes associées seront aussi supprimées.'))return;await supabase.from('demandes').delete().eq('soiree_id',id);await supabase.from('soirees').delete().eq('id',id);setSoirees(prev=>prev.filter(s=>s.id!==id));};
  useEffect(()=>{async function load(){const{data:soirs}=await supabase.from('soirees').select('*').eq('etablissement_id',user.id).order('date_soiree',{ascending:true});const res=[];for(const s of(soirs||[])){const{data:dems}=await supabase.from('demandes').select('*, artistes:artiste_id(nom_scene, type_artiste, photo_url)').eq('soiree_id',s.id);res.push({...s,demandes:dems||[]});}setSoirees(res);setLoadingSoirees(false);}load();},[]);
  const formatD=(d)=>{if(!d)return'';const dt=new Date(d+'T00:00:00');const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return`${dt.getDate()} ${mn[dt.getMonth()]} ${dt.getFullYear()}`;};
  const sc={draft:{bg:'bg-accent/10 border-accent/20 text-accent',label:'Cherche artiste'},confirmed:{bg:'bg-green-400/10 border-green-400/20 text-green-400',label:'Confirmé'},cancelled:{bg:'bg-red-400/10 border-red-400/20 text-red-400',label:'Annulé'}};
 
  return(
    <div className="min-h-screen px-4 py-20"><div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue/20 to-bg-mid flex items-center justify-center text-xl border-2 border-blue/20 overflow-hidden">{data.photos?.length>0?<img src={data.photos[0]} alt="" className="w-full h-full object-cover"/>:<span>🍸</span>}</div>
          <div><div className="font-display text-lg font-semibold">{data.nom}</div><div className="text-xs text-dim">📍 {data.ville}</div></div>
        </div>
        <div className="flex gap-2"><Link href="/messages" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition">💬</Link><Link href="/onboarding/etablissement" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition">⚙️</Link></div>
      </div>
 
      <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-blue">{soirees.length}</div><div className="text-[11px] text-dim mt-1">Soirées</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-green-400">{soirees.filter(s=>s.status==='confirmed').length}</div><div className="text-[11px] text-dim mt-1">Confirmées</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-accent">{soirees.reduce((n,s)=>n+s.demandes.length,0)}</div><div className="text-[11px] text-dim mt-1">Demandes</div></div>
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.1s'}}>
        <h2 className="text-sm font-medium flex items-center gap-2 mb-3">📅 Mes soirées</h2>
        <Link href="/soiree/creer" className="w-full flex items-center justify-center gap-2 p-3.5 border border-dashed border-dim rounded-xl text-sm text-dim hover:border-blue hover:text-blue hover:bg-blue/5 transition mb-3"><span className="text-lg">+</span> Créer une nouvelle soirée</Link>
        {loadingSoirees?<div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-blue/30 border-t-blue rounded-full animate-spin"/></div>:
        soirees.length===0?<div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-3xl mb-2">📅</div><p className="text-xs text-dim">Aucune soirée</p></div>:
        <div className="space-y-2">{soirees.map(s=>{const st=sc[s.status]||sc.draft;return(
          <div key={s.id} className="bg-bg border border-border rounded-xl p-4 hover:border-dim transition">
            <div className="flex items-start justify-between mb-3"><div><div className="text-sm font-medium">{s.titre}</div><div className="text-xs text-dim mt-1">📅 {formatD(s.date_soiree)} · {s.heure_debut||''}–{s.heure_fin||''}</div></div><span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${st.bg}`}>{st.label}</span></div>
            {<div className="flex flex-wrap gap-2 mb-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue border border-blue/15">{s.demandes.filter(d=>d.status==='accepted').length}/{s.nb_artistes||1} artiste{(s.nb_artistes||1)>1?'s':''}</span>{s.demandes.map((d,i)=>(<div key={i} className="flex items-center gap-1.5 text-xs bg-bg-card border border-border rounded-lg px-2.5 py-1.5"><span>{ARTIST_EMOJIS[d.artistes?.type_artiste]||'🎵'}</span><span className="font-medium">{d.artistes?.nom_scene}</span><span className={`text-[9px] px-1.5 py-0.5 rounded ${d.status==='accepted'?'bg-green-400/10 text-green-400':d.status==='declined'?'bg-red-400/10 text-red-400':'bg-accent/10 text-accent'}`}>{d.status==='accepted'?'OK':d.status==='declined'?'Refusé':'En attente'}</span></div>))}</div>}
            <div className="flex items-center justify-between pt-3 border-t border-border"><span className="text-xs text-dim">{s.ambiance&&`🎵 ${s.ambiance}`}{s.cachet&&<span className="ml-2">💰 {s.cachet}€{s.moyen_paiement&&` · ${s.moyen_paiement}`}</span>}</span>{s.status==='draft'&&<Link href="/explorer" className="text-xs px-3 py-1.5 rounded-lg bg-blue text-black font-medium">Trouver un artiste</Link>}<button onClick={()=>deleteSoiree(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition">🗑️</button></div>
          </div>);})}</div>}
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.2s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">🏪 Ma fiche</h2><Link href="/onboarding/etablissement" className="text-xs text-dim hover:text-muted">Modifier</Link></div>
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="flex gap-1 flex-shrink-0">{data.photos?.length>0?data.photos.slice(0,2).map((p,i)=>(<div key={i} className="w-12 h-9 rounded-md overflow-hidden bg-bg-card"><img src={p} alt="" className="w-full h-full object-cover"/></div>)):(<div className="w-12 h-9 rounded-md bg-bg-card flex items-center justify-center text-dim text-xs">📷</div>)}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{data.nom}</div><div className="text-xs text-dim mt-0.5">📍 {data.adresse||data.ville}</div></div>
          <div className="text-right flex-shrink-0"><div className={`text-lg font-semibold ${completion===100?'text-green-400':'text-blue'}`}>{completion}%</div><div className="text-[10px] text-dim">Complet</div></div>
        </div>
      </div>
      <BottomNav active="home" role="etablissement"/>
    </div></div>
  );
}
 
function BottomNav({active,role}){const isA=role==='artiste';const c=isA?'text-accent':'text-blue';const items=isA?[{id:'home',icon:'🏠',label:'Accueil'},{id:'explore',icon:'🔍',label:'Explorer',href:'/explorer'},{id:'messages',icon:'💬',label:'Messages',href:'/messages'},{id:'profile',icon:'👤',label:'Profil',href:'/onboarding/artiste'}]:[{id:'home',icon:'🏠',label:'Accueil'},{id:'explore',icon:'🔍',label:'Explorer',href:'/explorer'},{id:'events',icon:'📅',label:'Nouvelle soirée',href:'/soiree/creer'},{id:'messages',icon:'💬',label:'Messages',href:'/messages'},{id:'venue',icon:'🏪',label:'Ma fiche',href:'/onboarding/etablissement'}];return(<div className="flex justify-around pt-4 border-t border-border mt-6">{items.map(n=>{const iA=n.id===active;const ct=(<><span className={`text-lg ${iA?'':'opacity-40'}`}>{n.icon}</span><span className={`text-[9px] uppercase tracking-wider ${iA?c:'text-dim'}`}>{n.label}</span></>);return n.href?(<Link key={n.id} href={n.href} className="flex flex-col items-center gap-1">{ct}</Link>):(<div key={n.id} className="flex flex-col items-center gap-1 cursor-pointer">{ct}</div>);})}</div>);}
 
