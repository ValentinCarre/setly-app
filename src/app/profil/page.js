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
const[pendingRatings,setPendingRatings]=useState(null);
  const[ratingsLoaded,setRatingsLoaded]=useState(false);
 
  useEffect(()=>{
    if(!user||!data||!profile)return;
    async function checkRatings(){
      const todayStr=new Date().toISOString().split('T')[0];
      const{data:myReviews}=await supabase.from('avis').select('soiree_id,reviewed_id').eq('reviewer_id',user.id);
      const reviewedPairs=(myReviews||[]).map(r=>r.soiree_id+'_'+r.reviewed_id);
 
      if(isArtist){
        const{data:dems}=await supabase.from('demandes').select('*, soirees(*), etablissements:etablissement_id(nom, photos, ville)').eq('artiste_id',user.id).eq('status','accepted');
        const toRate=(dems||[]).filter(d=>d.soirees&&d.soirees.date_soiree<todayStr&&!reviewedPairs.includes(d.soiree_id+'_'+d.soirees.etablissement_id)).map(d=>({soireeId:d.soiree_id,soiree:d.soirees,targetId:d.soirees.etablissement_id,targetName:d.etablissements?.nom||'Établissement',targetRole:'etablissement'}));
        setPendingRatings(toRate);
      } else {
        const{data:soirs}=await supabase.from('soirees').select('*').eq('etablissement_id',user.id).eq('status','confirmed');
        const pastSoirs=(soirs||[]).filter(s=>s.date_soiree<todayStr);
        const toRate=[];
        for(const s of pastSoirs){
          const{data:dems}=await supabase.from('demandes').select('artiste_id, artistes:artiste_id(nom_scene, type_artiste, photo_url)').eq('soiree_id',s.id).eq('status','accepted');
          (dems||[]).forEach(d=>{if(!reviewedPairs.includes(s.id+'_'+d.artiste_id)){toRate.push({soireeId:s.id,soiree:s,targetId:d.artiste_id,targetName:d.artistes?.nom_scene||'Artiste',targetRole:'artiste'});}});
        }
        setPendingRatings(toRate);
      }
      setRatingsLoaded(true);
    }
    checkRatings();
  },[user,data,profile]);
 
  if(!ratingsLoaded)return<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin"/></div>;
 
  if(pendingRatings&&pendingRatings.length>0)return<MandatoryRating ratings={pendingRatings} supabase={supabase} userId={user.id} role={profile.role} onComplete={()=>setPendingRatings([])} />;
 
  if(isArtist)return<ArtistDashboard data={data} user={user} completion={gc()} supabase={supabase}/>;
  return<VenueDashboard data={data} user={user} completion={gc()} supabase={supabase}/>;}
 
function MandatoryRating({ ratings, supabase, userId, role, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [note, setNote] = useState(0);
  const [hover, setHover] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [sending, setSending] = useState(false);
 
  const item = ratings[current];
  const isLast = current === ratings.length - 1;
  const color = role === 'artiste' ? 'accent' : 'blue';
 
  const formatDM = (d) => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); const mn = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']; return `${dt.getDate()} ${mn[dt.getMonth()]} ${dt.getFullYear()}`; };
 
  const submit = async () => {
    if (!note) return;
    setSending(true);
    await supabase.from('avis').insert({
      soiree_id: item.soireeId,
      reviewer_id: userId,
      reviewed_id: item.targetId,
      note,
      commentaire: commentaire.trim() || null,
    });
    setSending(false);
    setNote(0);
    setHover(0);
    setCommentaire('');
    if (isLast) {
      onComplete();
    } else {
      setCurrent(prev => prev + 1);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full animate-fade-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⭐</div>
          <h1 className="font-display text-2xl font-bold">Comment s&apos;est passée la soirée ?</h1>
          <p className="text-sm text-muted mt-2">Évaluez {item.targetRole === 'artiste' ? "l'artiste" : "l'établissement"} avant d&apos;accéder à votre tableau de bord</p>
          {ratings.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {ratings.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition ${i === current ? (role === 'artiste' ? 'bg-accent' : 'bg-blue') : i < current ? 'bg-green-400' : 'bg-dim/30'}`} />
              ))}
              <span className="text-[10px] text-dim ml-1">{current + 1}/{ratings.length}</span>
            </div>
          )}
        </div>
 
        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="text-center">
            <div className="text-lg font-semibold">{item.targetName}</div>
            <div className="text-xs text-dim mt-1">{item.targetRole === 'artiste' ? '🎧 Artiste' : '🍸 Établissement'}</div>
            <div className={`text-xs mt-2 px-3 py-1.5 rounded-lg bg-bg-mid inline-block`}>
              🎵 {item.soiree.titre} · {formatDM(item.soiree.date_soiree)}
            </div>
          </div>
 
          <div className="text-center">
            <div className="text-xs text-dim uppercase tracking-wider font-medium mb-3">Votre note *</div>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setNote(n)}
                  className={`text-4xl transition-transform hover:scale-110 ${n <= (hover || note) ? 'text-amber-400' : 'text-dim/20'}`}>★</button>
              ))}
            </div>
            {note > 0 && (
              <div className="text-sm text-amber-400 font-medium mt-2">
                {note === 1 ? 'Décevant' : note === 2 ? 'Moyen' : note === 3 ? 'Bien' : note === 4 ? 'Très bien' : 'Excellent'} — {note}/5
              </div>
            )}
          </div>
 
          <div>
            <label className="text-xs text-dim uppercase tracking-wider font-medium block mb-1.5">Commentaire (optionnel)</label>
            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={3}
              className="w-full bg-bg-mid border border-border rounded-lg px-4 py-3 text-sm text-white focus:border-amber-400/50 transition resize-none placeholder:text-dim"
              placeholder={item.targetRole === 'artiste' ? "Comment était la prestation ?" : "Comment était l'accueil, le lieu ?"} />
          </div>
 
          <button onClick={submit} disabled={!note || sending}
            className={`w-full font-bold py-3.5 rounded-xl transition disabled:opacity-30 ${note ? 'bg-amber-400 text-black hover:shadow-lg hover:shadow-amber-400/25' : 'bg-bg-mid text-dim'}`}>
            {sending ? 'Envoi...' : !note ? '⭐ Sélectionnez une note pour continuer' : isLast ? '✓ Envoyer et accéder au tableau de bord' : `⭐ Envoyer et passer au suivant (${current + 2}/${ratings.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
 
function ArtistDashboard({data,user,completion,supabase}){
  const[datesDispo,setDatesDispo]=useState(data.dates_dispo||[]);
  const[soireesToRate,setSoireesToRate]=useState([]);
  const[myAvis,setMyAvis]=useState([]);
  const[avgRating,setAvgRating]=useState(null);
  const[ratingCount,setRatingCount]=useState(0);
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
      // Load past confirmed soirées to rate
      const today=new Date().toISOString().split('T')[0];
      const pastAccepted=(dems||[]).filter(d=>d.status==='accepted'&&d.soirees&&d.soirees.date_soiree<today);
      // Load existing avis by this artist
      const{data:myReviews}=await supabase.from('avis').select('*').eq('reviewer_id',user.id);
      setMyAvis(myReviews||[]);
      const reviewedSoireeIds=(myReviews||[]).map(r=>r.soiree_id);
      setSoireesToRate(pastAccepted.filter(d=>!reviewedSoireeIds.includes(d.soiree_id)));
      // Load received ratings
      const{data:receivedAvis}=await supabase.from('avis').select('note').eq('reviewed_id',user.id);
      if(receivedAvis&&receivedAvis.length>0){
        setAvgRating((receivedAvis.reduce((s,a)=>s+a.note,0)/receivedAvis.length).toFixed(1));
        setRatingCount(receivedAvis.length);
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
        if((count||0)>=needed){
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
        <div className="bg-bg-card rounded-xl p-3.5 text-center">{avgRating?<><div className="text-xl font-semibold text-amber-400">{avgRating}</div><div className="text-[10px] text-amber-400">{'★'.repeat(Math.round(avgRating))+'☆'.repeat(5-Math.round(avgRating))}</div><div className="text-[10px] text-dim">{ratingCount} avis</div></>:<><div className="text-xl font-semibold text-dim">—</div><div className="text-[11px] text-dim mt-1">Note</div></>}</div>
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
                  <PostulerButton soiree={s} supabase={supabase} userId={user.id} artistName={data.nom_scene} />
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
 
      {/* RATE SOIRÉES */}
      {soireesToRate.length>0&&(
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.18s'}}>
          <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><span>⭐</span><span className="text-sm font-medium text-amber-400">Soirées à évaluer</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{soireesToRate.length}</span></div>
            <div className="space-y-2">{soireesToRate.map(d=>{const s=d.soirees;const e=d.etablissements;return(<RateCard key={d.id} soiree={s} targetId={s.etablissement_id} targetName={e?.nom||'Établissement'} targetRole="etablissement" supabase={supabase} userId={user.id} onRated={(avis)=>{setSoireesToRate(prev=>prev.filter(x=>x.id!==d.id));setMyAvis(prev=>[...prev,avis]);}} />);})}</div>
          </div>
        </div>
      )}
 
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
  const[candidatures,setCandidatures]=useState([]);
  const[soireesToRate,setSoireesToRate]=useState([]);
  const[avgRating,setAvgRating]=useState(null);
  const[ratingCount,setRatingCount]=useState(0);
  const handleCandidature=async(id,newStatus)=>{
    await supabase.from('demandes').update({status:newStatus}).eq('id',id);
    if(newStatus==='accepted'){
      const cand=candidatures.find(c=>c.id===id);
      if(cand&&cand.soirees){
        const{count}=await supabase.from('demandes').select('*',{count:'exact',head:true}).eq('soiree_id',cand.soiree_id).eq('status','accepted');
        const needed=cand.soirees.nb_artistes||1;
        if((count||0)>=needed){
          await supabase.from('soirees').update({status:'confirmed'}).eq('id',cand.soiree_id);
          // Update local soirées state to reflect confirmed status
          setSoirees(prev=>prev.map(s=>s.id===cand.soiree_id?{...s,status:'confirmed'}:s));
        }
      }
    }
    setCandidatures(prev=>prev.map(c=>c.id===id?{...c,status:newStatus}:c));
  };
  const deleteSoiree=async(id)=>{if(!confirm('Supprimer cette soirée ? Les demandes associées seront aussi supprimées.'))return;await supabase.from('demandes').delete().eq('soiree_id',id);await supabase.from('soirees').delete().eq('id',id);setSoirees(prev=>prev.filter(s=>s.id!==id));};
  useEffect(()=>{async function load(){const{data:soirs}=await supabase.from('soirees').select('*').eq('etablissement_id',user.id).order('date_soiree',{ascending:true});const res=[];for(const s of(soirs||[])){const{data:dems}=await supabase.from('demandes').select('*, artistes:artiste_id(nom_scene, type_artiste, photo_url)').eq('soiree_id',s.id);res.push({...s,demandes:dems||[]});}setSoirees(res);
      // Auto-fix: check soirées that should be confirmed
      for(const s of res){
        if(s.status==='draft'){
          const acceptedCount=s.demandes.filter(d=>d.status==='accepted').length;
          const needed=s.nb_artistes||1;
          if(acceptedCount>=needed){
            await supabase.from('soirees').update({status:'confirmed'}).eq('id',s.id);
            s.status='confirmed';
          }
        }
      }
      setSoirees([...res]);
      // Load candidatures (demandes initiated by artists)
      const{data:cands}=await supabase.from('demandes').select('*, soirees(*), artistes:artiste_id(nom_scene, type_artiste, photo_url, ville, styles)').eq('etablissement_id',user.id).eq('initiated_by','artiste').order('created_at',{ascending:false});
      setCandidatures(cands||[]);
      // Load past soirées to rate (confirmed + date passed)
      const todayStr=new Date().toISOString().split('T')[0];
      const pastSoirees=res.filter(s=>s.status==='confirmed'&&s.date_soiree<todayStr&&s.demandes.some(d=>d.status==='accepted'));
      const{data:myReviews}=await supabase.from('avis').select('*').eq('reviewer_id',user.id);
      const reviewedPairs=(myReviews||[]).map(r=>r.soiree_id+'_'+r.reviewed_id);
      const toRate=[];
      pastSoirees.forEach(s=>{s.demandes.filter(d=>d.status==='accepted').forEach(d=>{if(!reviewedPairs.includes(s.id+'_'+d.artiste_id)){toRate.push({soiree:s,artiste:d.artistes,artisteId:d.artiste_id});}});});
      setSoireesToRate(toRate);
      // Received ratings
      const{data:receivedAvis}=await supabase.from('avis').select('note').eq('reviewed_id',user.id);
      if(receivedAvis&&receivedAvis.length>0){setAvgRating((receivedAvis.reduce((sum,a)=>sum+a.note,0)/receivedAvis.length).toFixed(1));setRatingCount(receivedAvis.length);}
      setLoadingSoirees(false);}load();},[]);
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
        <div className="bg-bg-card rounded-xl p-3.5 text-center">{avgRating?<><div className="text-xl font-semibold text-amber-400">{avgRating}</div><div className="text-[10px] text-amber-400">{'★'.repeat(Math.round(avgRating))+'☆'.repeat(5-Math.round(avgRating))}</div><div className="text-[10px] text-dim">{ratingCount} avis</div></>:<><div className="text-xl font-semibold text-dim">—</div><div className="text-[11px] text-dim mt-1">Note</div></>}</div>
      </div>
 
      
      {/* CANDIDATURES */}
      {candidatures.filter(c=>c.status==='pending').length>0&&(
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.08s'}}>
          <div className="bg-blue/5 border border-blue/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><span className="text-blue">🎤</span><span className="text-sm font-medium text-blue">Candidatures reçues</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">{candidatures.filter(c=>c.status==='pending').length}</span></div>
            <div className="space-y-2">{candidatures.filter(c=>c.status==='pending').map(c=>{const a=c.artistes;const s=c.soirees;const formatDV=(d)=>{if(!d)return'';const dt=new Date(d+'T00:00:00');const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return`${dt.getDate()} ${mn[dt.getMonth()]}`;};return(
              <div key={c.id} className="bg-bg border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">{a?.photo_url?<img src={a.photo_url} alt="" className="w-full h-full object-cover"/>:ARTIST_EMOJIS[a?.type_artiste]||'🎵'}</div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium">{a?.nom_scene}</div><div className="text-[11px] text-dim">{a?.type_artiste} · {a?.ville}</div>{a?.styles?.length>0&&<div className="flex gap-1 mt-1">{a.styles.slice(0,3).map(st=>(<span key={st} className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{st}</span>))}</div>}</div>
                </div>
                <div className="text-xs text-dim mb-2">Pour : <span className="text-white font-medium">{s?.titre}</span> · {formatDV(s?.date_soiree)} · {s?.heure_debut}–{s?.heure_fin}</div>
                {c.message&&<div className="text-xs text-muted italic mb-3 bg-bg-card rounded-lg p-2.5">&quot;{c.message}&quot;</div>}
                <div className="flex gap-2">
                  <button onClick={()=>handleCandidature(c.id,'declined')} className="text-xs px-4 py-2 rounded-lg bg-bg-card border border-border text-muted hover:text-white transition">Refuser</button>
                  <button onClick={()=>handleCandidature(c.id,'accepted')} className="flex-1 text-xs py-2 rounded-lg bg-blue text-black font-medium">✓ Accepter {a?.nom_scene}</button>
                  <Link href={`/messages?to=${c.artiste_id}&name=${encodeURIComponent(a?.nom_scene||'')}`} className="text-xs px-4 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20">💬</Link>
                </div>
              </div>
            );})}</div>
          </div>
        </div>
      )}
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.1s'}}>
        <h2 className="text-sm font-medium flex items-center gap-2 mb-3">📅 Mes soirées</h2>
        <Link href="/soiree/creer" className="w-full flex items-center justify-center gap-2 p-3.5 border border-dashed border-dim rounded-xl text-sm text-dim hover:border-blue hover:text-blue hover:bg-blue/5 transition mb-3"><span className="text-lg">+</span> Créer une nouvelle soirée</Link>
        {loadingSoirees?<div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-blue/30 border-t-blue rounded-full animate-spin"/></div>:
        soirees.length===0?<div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-3xl mb-2">📅</div><p className="text-xs text-dim">Aucune soirée</p></div>:
        <div className="space-y-2">{soirees.map(s=>{const st=sc[s.status]||sc.draft;return(
          <div key={s.id} className="bg-bg border border-border rounded-xl p-4 hover:border-dim transition">
            <div className="flex items-start justify-between mb-3"><div><div className="text-sm font-medium">{s.titre}</div><div className="text-xs text-dim mt-1">📅 {formatD(s.date_soiree)} · {s.heure_debut||''}–{s.heure_fin||''}</div></div><span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${st.bg}`}>{st.label}</span></div>
            {<div className="flex flex-wrap gap-2 mb-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue border border-blue/15">{s.demandes.filter(d=>d.status==='accepted').length}/{s.nb_artistes||1} artiste{(s.nb_artistes||1)>1?'s':''}</span>{s.demandes.map((d,i)=>(<div key={i} className="flex items-center gap-1.5 text-xs bg-bg-card border border-border rounded-lg px-2.5 py-1.5"><span>{ARTIST_EMOJIS[d.artistes?.type_artiste]||'🎵'}</span><span className="font-medium">{d.artistes?.nom_scene}</span><span className={`text-[9px] px-1.5 py-0.5 rounded ${d.status==='accepted'?'bg-green-400/10 text-green-400':d.status==='declined'?'bg-red-400/10 text-red-400':'bg-accent/10 text-accent'}`}>{d.status==='accepted'?'OK':d.status==='declined'?'Refusé':'En attente'}</span></div>))}</div>}
            <div className="flex items-center justify-between pt-3 border-t border-border"><span className="text-xs text-dim">{s.ambiance&&`🎵 ${s.ambiance}`}{s.cachet&&<span className="ml-2">💰 {s.cachet}€{s.moyen_paiement&&` · ${s.moyen_paiement}`}</span>}</span><div className="flex gap-2">{s.status==='draft'&&<Link href="/explorer" className="text-xs px-3 py-1.5 rounded-lg bg-blue text-black font-medium">Trouver un artiste</Link>}<button onClick={()=>deleteSoiree(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 transition">🗑️</button></div></div>
          </div>);})}</div>}
      </div>
 
      {/* RATE ARTISTS */}
      {soireesToRate.length>0&&(
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.18s'}}>
          <div className="bg-amber-400/5 border border-amber-400/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3"><span>⭐</span><span className="text-sm font-medium text-amber-400">Artistes à évaluer</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">{soireesToRate.length}</span></div>
            <div className="space-y-2">{soireesToRate.map((item,i)=>(<RateCard key={i} soiree={item.soiree} targetId={item.artisteId} targetName={item.artiste?.nom_scene||'Artiste'} targetRole="artiste" supabase={supabase} userId={user.id} onRated={()=>{setSoireesToRate(prev=>prev.filter((_,j)=>j!==i));}} />))}</div>
          </div>
        </div>
      )}
 
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
 
function RateCard({ soiree, targetId, targetName, targetRole, supabase, userId, onRated }) {
  const [note, setNote] = useState(0);
  const [hover, setHover] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
 
  const formatDR = (d) => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); const mn = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']; return `${dt.getDate()} ${mn[dt.getMonth()]}`; };
 
  const submit = async () => {
    if (!note) return;
    setSending(true);
    const avis = { soiree_id: soiree.id, reviewer_id: userId, reviewed_id: targetId, note, commentaire: commentaire.trim() || null };
    await supabase.from('avis').insert(avis);
    setSending(false);
    setSent(true);
    if (onRated) onRated(avis);
  };
 
  if (sent) return <div className="bg-bg border border-green-400/20 rounded-lg p-3 text-center"><span className="text-xs text-green-400">✓ Avis envoyé pour {targetName}</span></div>;
 
  return (
    <div className="bg-bg border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium">{targetName}</div>
          <div className="text-[10px] text-dim">{soiree.titre} · {formatDR(soiree.date_soiree)}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card text-dim">{targetRole === 'artiste' ? '🎧' : '🍸'}</span>
      </div>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setNote(n)}
            className={`text-2xl transition ${n <= (hover || note) ? 'text-amber-400' : 'text-dim/30'}`}
            style={{ cursor: 'pointer' }}>★</button>
        ))}
        {note > 0 && <span className="text-xs text-amber-400 ml-2 font-medium">{note}/5</span>}
      </div>
      <input value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Commentaire (optionnel)" className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-white focus:border-amber-400/50 transition placeholder:text-dim mb-3" />
      <button onClick={submit} disabled={!note || sending} className="w-full text-xs py-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 font-medium hover:bg-amber-400/20 transition disabled:opacity-30">
        {sending ? '...' : '⭐ Envoyer mon avis'}
      </button>
    </div>
  );
}
 
function PostulerButton({ soiree, supabase, userId, artistName }) {
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
 
  const handlePostuler = async () => {
    setSending(true);
    // Create demande initiated by artist
    await supabase.from('demandes').insert({
      soiree_id: soiree.id,
      etablissement_id: soiree.etablissement_id,
      artiste_id: userId,
      status: 'pending',
      message: msg.trim() || null,
      initiated_by: 'artiste',
    });
 
    // Auto-send message in conversation
    const convId = [userId, soiree.etablissement_id].sort().join('_');
    const autoMsg = msg.trim()
      ? `🎤 Candidature pour "${soiree.titre}" — ${msg.trim()}`
      : `🎤 Je postule pour votre soirée "${soiree.titre}" !`;
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: userId,
      receiver_id: soiree.etablissement_id,
      content: autoMsg,
      read: false,
    });
 
    setSending(false);
    setSent(true);
    setShow(false);
    setMsg('');
  };
 
  if (sent) return <span className="text-xs px-3 py-1.5 rounded-lg bg-green-400/10 text-green-400 border border-green-400/20 flex-shrink-0">✓ Candidature envoyée</span>;
 
  return (
    <div className="flex-shrink-0">
      {!show ? (
        <button onClick={() => setShow(true)} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition">Postuler</button>
      ) : (
        <div className="mt-2 bg-bg border border-accent/20 rounded-xl p-3 animate-fade-up space-y-2" style={{minWidth:'220px'}}>
          <div className="text-[11px] font-medium text-accent">🎤 Postuler pour {soiree.titre}</div>
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message personnalisé (optionnel)" className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-xs text-white focus:border-accent transition placeholder:text-dim" />
          <div className="flex gap-2">
            <button onClick={() => { setShow(false); setMsg(''); }} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white transition">Annuler</button>
            <button onClick={handlePostuler} disabled={sending} className="flex-1 text-xs py-1.5 rounded-lg bg-accent text-black font-medium disabled:opacity-50">{sending ? '...' : '📨 Envoyer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
 
function BottomNav({active,role}){const isA=role==='artiste';const c=isA?'text-accent':'text-blue';const items=isA?[{id:'home',icon:'🏠',label:'Accueil'},{id:'explore',icon:'🔍',label:'Explorer',href:'/explorer'},{id:'messages',icon:'💬',label:'Messages',href:'/messages'},{id:'profile',icon:'👤',label:'Profil',href:'/onboarding/artiste'}]:[{id:'home',icon:'🏠',label:'Accueil'},{id:'explore',icon:'🔍',label:'Explorer',href:'/explorer'},{id:'events',icon:'📅',label:'Nouvelle soirée',href:'/soiree/creer'},{id:'messages',icon:'💬',label:'Messages',href:'/messages'},{id:'venue',icon:'🏪',label:'Ma fiche',href:'/onboarding/etablissement'}];return(<div className="flex justify-around pt-4 border-t border-border mt-6">{items.map(n=>{const iA=n.id===active;const ct=(<><span className={`text-lg ${iA?'':'opacity-40'}`}>{n.icon}</span><span className={`text-[9px] uppercase tracking-wider ${iA?c:'text-dim'}`}>{n.label}</span></>);return n.href?(<Link key={n.id} href={n.href} className="flex flex-col items-center gap-1">{ct}</Link>):(<div key={n.id} className="flex flex-col items-center gap-1 cursor-pointer">{ct}</div>);})}</div>);}
 
