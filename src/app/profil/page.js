'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_EMOJIS, EQUIPEMENTS } from '@/lib/constants';
 
function Calendar({ selectedDates=[], onToggleDate, color='accent', mode='multi' }) {
  const [vm, setVm] = useState(new Date());
  const y=vm.getFullYear(),m=vm.getMonth(),t=new Date();t.setHours(0,0,0,0);
  const dim=new Date(y,m+1,0).getDate(),fd=new Date(y,m,1).getDay(),adj=fd===0?6:fd-1;
  const mn=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const dn=['Lu','Ma','Me','Je','Ve','Sa','Di'];
  const ds=(d)=>selectedDates.includes(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  const ip=(d)=>new Date(y,m,d)<t;const it=(d)=>y===t.getFullYear()&&m===t.getMonth()&&d===t.getDate();
  const hc=(d)=>{if(!ip(d))onToggleDate(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);};
  const ab=color==='blue'?'bg-blue':'bg-accent',abr=color==='blue'?'border-blue/30':'border-accent/30',at=color==='blue'?'text-blue':'text-accent';
  return(<div className="bg-bg border border-border rounded-xl p-4">
    <div className="flex items-center justify-between mb-3"><button onClick={()=>setVm(new Date(y,m-1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">←</button><div className="text-sm font-semibold">{mn[m]} {y}</div><button onClick={()=>setVm(new Date(y,m+1,1))} className="w-8 h-8 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition text-sm">→</button></div>
    <div className="grid grid-cols-7 gap-1 mb-1">{dn.map(d=>(<div key={d} className="text-center text-[10px] text-dim font-medium py-1">{d}</div>))}</div>
    <div className="grid grid-cols-7 gap-1">{Array.from({length:adj}).map((_,i)=>(<div key={`e${i}`}/>))}{Array.from({length:dim}).map((_,i)=>{const d=i+1,s=ds(d),p=ip(d),td=it(d);return(<button key={d} onClick={()=>hc(d)} disabled={p} className={`h-9 rounded-lg text-xs font-medium transition ${p?'text-dim/30 cursor-not-allowed':'cursor-pointer hover:bg-bg-card'} ${s&&!p?`${ab} text-black font-bold`:''} ${td&&!s?`border ${abr} ${at}`:''} ${!s&&!p&&!td?'text-muted':''}`}>{d}</button>);})}</div>
    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border"><div className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${ab}`}></div><span className="text-[10px] text-dim">{mode==='multi'?'Disponible':'Sélectionné'}</span></div>{selectedDates.length>0&&<span className={`text-[10px] ${at} ml-auto font-medium`}>{selectedDates.length} date{selectedDates.length>1?'s':''}</span>}</div>
  </div>);
}
 
export default function Profil() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  useEffect(() => { async function load() { const{data:{user}}=await supabase.auth.getUser(); if(!user){router.push('/login');return;} setUser(user); const{data:prof}=await supabase.from('profiles').select('*').eq('id',user.id).single(); setProfile(prof); if(prof?.role==='artiste'){const{data:art}=await supabase.from('artistes').select('*').eq('id',user.id).single();setData(art);}else{const{data:etab}=await supabase.from('etablissements').select('*').eq('id',user.id).single();setData(etab);} setLoading(false);} load();}, []);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin"/></div>;
  if (!profile?.onboarding_done||!data) return(<div className="min-h-screen flex items-center justify-center px-4"><div className="text-center animate-fade-up"><div className="text-5xl mb-4">{profile?.role==='artiste'?'🎧':'🍸'}</div><h2 className="font-display text-xl font-bold mb-2">Profil incomplet</h2><p className="text-sm text-muted mb-6">Complétez votre profil pour être visible</p><Link href={`/onboarding/${profile?.role==='artiste'?'artiste':'etablissement'}`} className="bg-accent text-black font-bold px-6 py-3 rounded-xl inline-block">Compléter mon profil</Link></div></div>);
  const isArtist = profile.role==='artiste';
  function getCompletion(){if(isArtist){const f=[data.nom_scene,data.ville,data.type_artiste,data.bio,data.photo_url,data.styles?.length>0,data.disponibilites?.length>0,data.soundcloud||data.instagram||data.spotify];return Math.round((f.filter(Boolean).length/f.length)*100);}const f=[data.nom,data.ville,data.adresse,data.type_etablissement?.length>0,data.ambiances?.length>0,data.equipements?.length>0,data.photos?.length>0,data.site_web,data.contact_nom];return Math.round((f.filter(Boolean).length/f.length)*100);}
  const completion=getCompletion();
  if(isArtist) return <ArtistDashboard data={data} user={user} completion={completion} supabase={supabase}/>;
  return <VenueDashboard data={data} user={user} completion={completion} supabase={supabase}/>;
}
 
function ArtistDashboard({ data, user, completion, supabase }) {
  const [datesDispo, setDatesDispo] = useState(data.dates_dispo || []);
  const [savingDates, setSavingDates] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [datesSaved, setDatesSaved] = useState(false);
 
  const toggleDate = (d) => { setDatesDispo(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]); setDatesSaved(false); };
  const saveDates = async () => { setSavingDates(true); await supabase.from('artistes').update({dates_dispo:datesDispo}).eq('id',user.id); setSavingDates(false); setDatesSaved(true); setTimeout(()=>setDatesSaved(false),3000); };
 
  const requests = [
    {id:1,venue:'Le Zinc — Bar à vins',emoji:'🍸',city:'Cannes',desc:'Soirée Deep House terrasse',date:'Sam 21 juin · 22h–02h',status:'new'},
    {id:2,venue:'La Terrazza',emoji:'🍽️',city:'Cannes',desc:'Set techno lounge',date:'Ven 27 juin · 20h–23h',status:'pending'},
    {id:3,venue:'Café de la Plage',emoji:'🏖️',city:'Nice',desc:'DJ set coucher de soleil',date:'Sam 14 juin · 18h–22h',status:'confirmed'},
  ];
  const events = [{day:'14',month:'Juin',title:'DJ set coucher de soleil',venue:'Café de la Plage · Nice',time:'18h – 22h',status:'confirmed'},{day:'21',month:'Juin',title:'Soirée Deep House terrasse',venue:'Le Zinc · Cannes',time:'22h – 02h',status:'new'}];
  const st = {new:{bg:'bg-accent/10 border-accent/20 text-accent',label:'Nouveau'},pending:{bg:'bg-blue/10 border-blue/20 text-blue',label:'En attente'},confirmed:{bg:'bg-green-400/10 border-green-400/20 text-green-400',label:'Confirmé'}};
 
  const formatD=(d)=>{const[y,m,day]=d.split('-');const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return`${parseInt(day)} ${mn[parseInt(m)-1]}`;};
 
  return (
    <div className="min-h-screen px-4 py-20"><div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-bg-mid flex items-center justify-center text-xl overflow-hidden border-2 border-accent/20">{data.photo_url?<img src={data.photo_url} alt="" className="w-full h-full object-cover"/>:<span>{ARTIST_EMOJIS[data.type_artiste]||'🎵'}</span>}</div>
          <div><div className="font-display text-lg font-semibold">Salut, {data.nom_scene}</div><span className="inline-flex items-center gap-1 text-xs bg-accent/10 border border-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium">⚡ Ambassadeur</span></div>
        </div>
        <div className="flex gap-2"><button className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition relative">🔔<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border border-bg"></span></button><Link href="/onboarding/artiste" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition">⚙️</Link></div>
      </div>
 
      <div className="grid grid-cols-4 gap-3 mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}>
        {[{val:'12',label:'Vues profil',color:'text-accent'},{val:'3',label:'Demandes',color:'text-blue'},{val:'2',label:'Soirées jouées',color:'text-accent'},{val:'4.9',label:'Note moyenne',color:'text-white'}].map((s,i)=>(<div key={i} className="bg-bg-card rounded-xl p-3.5 text-center"><div className={`text-xl font-semibold ${s.color}`}>{s.val}</div><div className="text-[11px] text-dim mt-1">{s.label}</div></div>))}
      </div>
 
      {/* CALENDAR SECTION */}
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.07s'}}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">📅 Mes disponibilités</h2>
          <button onClick={()=>setShowCal(!showCal)} className="text-xs text-accent hover:underline">{showCal?'Masquer':'Gérer mes dates'}</button>
        </div>
        {datesDispo.length > 0 && !showCal && (
          <div className="flex flex-wrap gap-1.5 mb-2">{datesDispo.sort().slice(0,8).map(d=>(<span key={d} className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 border border-accent/15 text-accent">{formatD(d)}</span>))}{datesDispo.length>8&&<span className="text-[10px] px-2.5 py-1 rounded-full bg-bg-card text-dim">+{datesDispo.length-8} dates</span>}</div>
        )}
        {datesDispo.length === 0 && !showCal && <p className="text-xs text-dim">Aucune date ajoutée — cliquez sur &quot;Gérer mes dates&quot; pour indiquer vos dispos</p>}
        {showCal && (
          <div className="space-y-3 animate-fade-up">
            <Calendar selectedDates={datesDispo} onToggleDate={toggleDate} color="accent" mode="multi" />
            <div className="flex items-center gap-3">
              <button onClick={saveDates} disabled={savingDates} className="text-xs px-4 py-2 rounded-lg bg-accent text-black font-medium hover:shadow-lg hover:shadow-accent/20 transition disabled:opacity-50">{savingDates?'Enregistrement...':'💾 Enregistrer mes dispos'}</button>
              {datesSaved && <span className="text-xs text-green-400">✓ Sauvegardé !</span>}
              <span className="text-[10px] text-dim ml-auto">{datesDispo.length} date{datesDispo.length!==1?'s':''}</span>
            </div>
          </div>
        )}
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.1s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">📩 Demandes reçues</h2><span className="text-xs text-dim cursor-pointer hover:text-muted">Tout voir</span></div>
        <div className="space-y-2">{requests.map(r=>{const s2=st[r.status];return(<div key={r.id} className="bg-bg border border-border rounded-xl p-4 hover:border-dim transition"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center text-lg">{r.emoji}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium">{r.venue}</div><div className="text-xs text-dim mt-0.5">{r.city} · {r.desc}</div></div><span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${s2.bg}`}>{s2.label}</span></div><div className="flex items-center justify-between mt-3 pt-3 border-t border-border"><span className="text-xs text-dim flex items-center gap-1.5">📅 {r.date}</span><div className="flex gap-2">{r.status==='new'&&(<><button className="text-xs px-3 py-1.5 rounded-lg bg-bg-card border border-border text-muted hover:text-white transition">Refuser</button><button className="text-xs px-3 py-1.5 rounded-lg bg-accent text-black font-medium">Accepter</button></>)}{(r.status==='pending'||r.status==='confirmed')&&(<button className="text-xs px-3 py-1.5 rounded-lg bg-blue/10 text-blue border border-blue/20">💬 Message</button>)}</div></div></div>);})}</div>
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.15s'}}>
        <h2 className="text-sm font-medium flex items-center gap-2 mb-3">📅 Prochaines soirées</h2>
        <div className="space-y-2">{events.map((e,i)=>{const s2=st[e.status];return(<div key={i} className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4 hover:border-dim transition"><div className="text-center w-12 flex-shrink-0"><div className="text-lg font-semibold">{e.day}</div><div className="text-[10px] text-dim uppercase tracking-wider">{e.month}</div></div><div className="flex-1 min-w-0"><div className="text-sm font-medium">{e.title}</div><div className="text-xs text-dim mt-0.5">{e.venue}</div><div className="text-xs text-accent flex items-center gap-1 mt-1">🕐 {e.time}</div></div><span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${s2.bg}`}>{s2.label}</span></div>);})}</div>
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.2s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">👤 Mon profil</h2><Link href="/onboarding/artiste" className="text-xs text-dim hover:text-muted">Modifier</Link></div>
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-bg-mid flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 border-2 border-accent/15">{data.photo_url?<img src={data.photo_url} alt="" className="w-full h-full object-cover"/>:<span>{ARTIST_EMOJIS[data.type_artiste]||'🎵'}</span>}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{data.nom_scene}</div><div className="text-xs text-accent mt-0.5">{data.type_artiste} · {data.ville}</div>{data.styles?.length>0&&(<div className="flex gap-1.5 mt-2 flex-wrap">{data.styles.slice(0,4).map(s=>(<span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/15 text-accent">{s}</span>))}{data.styles.length>4&&<span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card text-dim">+{data.styles.length-4}</span>}</div>)}</div>
          <div className="text-right flex-shrink-0"><div className={`text-lg font-semibold ${completion===100?'text-green-400':'text-accent'}`}>{completion}%</div><div className="text-[10px] text-dim">Complet</div></div>
        </div>
      </div>
 
      {completion<100&&(<div className="mb-5 animate-fade-up" style={{animationDelay:'0.25s'}}><div className="bg-accent/5 border border-accent/10 rounded-xl p-4 flex items-start gap-3"><span className="text-lg">💡</span><div><div className="text-sm font-medium">Complétez votre profil à 100%</div><div className="text-xs text-dim mt-1 leading-relaxed">Ajoutez votre lien SoundCloud et une photo pour apparaître 3x plus dans les recherches.</div></div></div></div>)}
      <BottomNav active="home" role="artiste"/>
    </div></div>
  );
}
 
function VenueDashboard({ data, user, completion, supabase }) {
  const [eventDates, setEventDates] = useState([]);
  const [showCal, setShowCal] = useState(false);
  const toggleDate = (d) => setEventDates(prev=>prev.includes(d)?prev.filter(x=>x!==d):[...prev,d]);
  const formatD=(d)=>{const[y,m,day]=d.split('-');const mn=['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];return`${parseInt(day)} ${mn[parseInt(m)-1]}`;};
 
  const events = [
    {id:1,title:'Soirée Jazz — Terrasse',date:'Vendredi 13 juin · 20h–23h',ambiance:'Jazz · Soul',status:'confirmed',artists:[{name:'Sofia V.',emoji:'🎤',ok:true},{name:'Marco D.',emoji:'🎷',ok:true}]},
    {id:2,title:'Nuit Électro',date:'Samedi 14 juin · 22h–02h',ambiance:'Deep House · Techno',status:'pending',artists:[{name:'DJ Milo',emoji:'🎧',ok:false}]},
    {id:3,title:'Soirée Acoustique',date:'Vendredi 20 juin · 19h–22h',ambiance:'Acoustique · Folk',status:'need',artists:[]},
  ];
  const suggestions = [
    {name:'Lucas Acoustic',emoji:'🎸',type:'Musicien',city:'Nice',dispo:'ven & sam',styles:['Folk','Acoustique'],match:94},
    {name:'Léa Rose',emoji:'🎤',type:'Chanteuse',city:'Cannes',dispo:'ven',styles:['Bossa Nova','Jazz vocal'],match:87},
    {name:'Nora B.',emoji:'🎧',type:'DJ',city:'Antibes',dispo:'sam',styles:['Lounge','Deep House'],match:82},
  ];
  const sc={confirmed:{bg:'bg-green-400/10 border-green-400/20 text-green-400',label:'Confirmé'},pending:{bg:'bg-blue/10 border-blue/20 text-blue',label:'En attente'},need:{bg:'bg-accent/10 border-accent/20 text-accent',label:'Cherche artiste'}};
 
  return (
    <div className="min-h-screen px-4 py-20"><div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border mb-5 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue/20 to-bg-mid flex items-center justify-center text-xl border-2 border-blue/20 overflow-hidden">{data.photos?.length>0?<img src={data.photos[0]} alt="" className="w-full h-full object-cover"/>:<span>🍸</span>}</div>
          <div><div className="font-display text-lg font-semibold">{data.nom}</div><div className="text-xs text-dim flex items-center gap-1">📍 {data.ville}</div></div>
        </div>
        <div className="flex gap-2"><button className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition relative">🔔<span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue rounded-full border border-bg"></span></button><Link href="/onboarding/etablissement" className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center text-muted hover:text-white transition">⚙️</Link></div>
      </div>
 
      <div className="grid grid-cols-4 gap-3 mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-blue">5</div><div className="text-[11px] text-dim mt-1">Soirées créées</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-accent">8</div><div className="text-[11px] text-dim mt-1">Artistes contactés</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold text-amber-400">4.3</div><div className="text-[10px] text-amber-400 mt-0.5">★★★★☆</div><div className="text-[10px] text-dim">187 avis</div></div>
        <div className="bg-bg-card rounded-xl p-3.5 text-center"><div className="text-xl font-semibold">142</div><div className="text-[11px] text-dim mt-1">Vues fiche</div></div>
      </div>
 
      {/* CALENDAR SECTION */}
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.07s'}}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">📅 Planifier une soirée</h2>
          <button onClick={()=>setShowCal(!showCal)} className="text-xs text-blue hover:underline">{showCal?'Masquer':'Choisir des dates'}</button>
        </div>
        {eventDates.length > 0 && !showCal && (
          <div className="flex flex-wrap gap-1.5 mb-2">{eventDates.sort().map(d=>(<span key={d} className="text-[10px] px-2.5 py-1 rounded-full bg-blue/10 border border-blue/15 text-blue flex items-center gap-1">{formatD(d)} <button onClick={()=>toggleDate(d)} className="hover:text-white">✕</button></span>))}</div>
        )}
        {showCal && (
          <div className="space-y-3 animate-fade-up">
            <Calendar selectedDates={eventDates} onToggleDate={toggleDate} color="blue" mode="multi" />
            <p className="text-[10px] text-dim">Sélectionnez des dates puis explorez les artistes disponibles</p>
            {eventDates.length > 0 && (
              <Link href="/explorer" className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg bg-blue text-black font-medium hover:shadow-lg hover:shadow-blue/20 transition">🔍 Voir les artistes disponibles ({eventDates.length} date{eventDates.length>1?'s':''})</Link>
            )}
          </div>
        )}
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.1s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">📅 Mes soirées</h2><span className="text-xs text-dim cursor-pointer hover:text-muted">Tout voir</span></div>
        <button className="w-full flex items-center justify-center gap-2 p-3.5 border border-dashed border-dim rounded-xl text-sm text-dim hover:border-blue hover:text-blue hover:bg-blue/5 transition mb-3"><span className="text-lg">+</span> Créer une nouvelle soirée</button>
        <div className="space-y-2">{events.map(ev=>{const s2=sc[ev.status];return(<div key={ev.id} className="bg-bg border border-border rounded-xl p-4 hover:border-dim transition"><div className="flex items-start justify-between mb-3"><div><div className="text-sm font-medium">{ev.title}</div><div className="text-xs text-dim mt-1 flex items-center gap-1.5">📅 {ev.date}</div></div><span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${s2.bg}`}>{s2.label}</span></div><div className="flex flex-wrap gap-2 mb-3">{ev.artists.map((a,i)=>(<div key={i} className="flex items-center gap-1.5 text-xs bg-bg-card border border-border rounded-lg px-2.5 py-1.5"><span>{a.emoji}</span><span className="font-medium">{a.name}</span><span className={`text-[9px] px-1.5 py-0.5 rounded ${a.ok?'bg-green-400/10 text-green-400':'bg-accent/10 text-accent'}`}>{a.ok?'OK':'En attente'}</span></div>))}{ev.status==='need'&&(<div className="flex items-center gap-1.5 text-xs border border-dashed border-dim rounded-lg px-2.5 py-1.5 text-dim"><span>+</span> Trouver un artiste</div>)}</div><div className="flex items-center justify-between pt-3 border-t border-border"><span className="text-xs text-dim flex items-center gap-1">🎵 {ev.ambiance}</span><div className="flex gap-2">{ev.status==='need'&&(<Link href="/explorer" className="text-xs px-3 py-1.5 rounded-lg bg-blue text-black font-medium">Explorer</Link>)}{ev.status==='pending'&&(<><button className="text-xs px-3 py-1.5 rounded-lg bg-bg-card border border-border text-muted hover:text-white transition">Modifier</button><button className="text-xs px-3 py-1.5 rounded-lg bg-blue text-black font-medium">Relancer</button></>)}{ev.status==='confirmed'&&(<button className="text-xs px-3 py-1.5 rounded-lg bg-bg-card border border-border text-muted hover:text-white transition">Détails</button>)}</div></div></div>);})}</div>
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.15s'}}>
        <div className="bg-blue/5 border border-blue/10 rounded-xl p-4"><div className="flex items-center gap-2 mb-3"><span className="text-blue">✨</span><span className="text-sm font-medium text-blue">Artistes suggérés pour vous</span></div><div className="space-y-2">{suggestions.map((s,i)=>(<div key={i} className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3 hover:border-dim transition"><div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-lg flex-shrink-0">{s.emoji}</div><div className="flex-1 min-w-0"><div className="text-sm font-medium">{s.name}</div><div className="text-[11px] text-dim">{s.type} · {s.city} · Dispo {s.dispo}</div><div className="flex gap-1 mt-1.5">{s.styles.map(st=>(<span key={st} className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/15 text-accent">{st}</span>))}</div></div><div className="text-right flex-shrink-0 mr-1"><div className="text-sm font-semibold text-green-400">{s.match}%</div><div className="text-[9px] text-dim">Match</div></div><button className="text-xs px-3 py-1.5 rounded-lg bg-blue text-black font-medium flex-shrink-0">Contacter</button></div>))}</div></div>
      </div>
 
      <div className="mb-5 animate-fade-up" style={{animationDelay:'0.2s'}}>
        <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium flex items-center gap-2">🏪 Ma fiche</h2><Link href="/onboarding/etablissement" className="text-xs text-dim hover:text-muted">Modifier</Link></div>
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="flex gap-1 flex-shrink-0">{data.photos?.length>0?data.photos.slice(0,2).map((p,i)=>(<div key={i} className="w-12 h-9 rounded-md overflow-hidden bg-bg-card"><img src={p} alt="" className="w-full h-full object-cover"/></div>)):(<><div className="w-12 h-9 rounded-md bg-bg-card flex items-center justify-center text-dim text-xs">📷</div><div className="w-12 h-9 rounded-md bg-bg-card flex items-center justify-center text-dim text-xs">📷</div></>)}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-semibold">{data.nom}</div><div className="text-xs text-dim flex items-center gap-1 mt-0.5">📍 {data.adresse||data.ville}</div><div className="flex gap-1 mt-1.5 flex-wrap">{data.type_etablissement?.slice(0,2).map(t=>(<span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{t}</span>))}{data.ambiances?.slice(0,2).map(a=>(<span key={a} className="text-[9px] px-2 py-0.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{a}</span>))}</div></div>
          <div className="text-right flex-shrink-0"><div className={`text-lg font-semibold ${completion===100?'text-green-400':'text-blue'}`}>{completion}%</div><div className="text-[10px] text-dim">Complet</div></div>
        </div>
      </div>
 
      {completion<100&&(<div className="mb-5 animate-fade-up" style={{animationDelay:'0.25s'}}><div className="bg-blue/5 border border-blue/10 rounded-xl p-4 flex items-start gap-3"><span className="text-lg">💡</span><div><div className="text-sm font-medium">Complétez votre fiche à 100%</div><div className="text-xs text-dim mt-1 leading-relaxed">Ajoutez des photos et vos équipements pour attirer plus d&apos;artistes.</div></div></div></div>)}
      <BottomNav active="home" role="etablissement"/>
    </div></div>
  );
}
 
function BottomNav({active,role}){const isA=role==='artiste';const c=isA?'text-accent':'text-blue';const items=isA?[{id:'home',icon:'🏠',label:'Accueil'},{id:'explore',icon:'🔍',label:'Explorer',href:'/explorer'},{id:'agenda',icon:'📅',label:'Agenda'},{id:'messages',icon:'💬',label:'Messages'},{id:'profile',icon:'👤',label:'Profil',href:'/onboarding/artiste'}]:[{id:'home',icon:'🏠',label:'Accueil'},{id:'explore',icon:'🔍',label:'Explorer',href:'/explorer'},{id:'events',icon:'📅',label:'Soirées'},{id:'messages',icon:'💬',label:'Messages'},{id:'venue',icon:'🏪',label:'Ma fiche',href:'/onboarding/etablissement'}];return(<div className="flex justify-around pt-4 border-t border-border mt-6">{items.map(n=>{const iA=n.id===active;const ct=(<><span className={`text-lg ${iA?'':'opacity-40'}`}>{n.icon}</span><span className={`text-[9px] uppercase tracking-wider ${iA?c:'text-dim'}`}>{n.label}</span></>);return n.href?(<Link key={n.id} href={n.href} className="flex flex-col items-center gap-1">{ct}</Link>):(<div key={n.id} className="flex flex-col items-center gap-1 cursor-pointer">{ct}</div>);})}</div>);}
