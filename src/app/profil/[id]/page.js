'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ARTIST_EMOJIS, EQUIPEMENTS } from '@/lib/constants';
 
export default function ProfilPublic() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [role, setRole] = useState(null);
  const [avis, setAvis] = useState([]);
  const [pastSoirees, setPastSoirees] = useState([]);
  const [upcomingSoirees, setUpcomingSoirees] = useState([]);
  const [myDemandesSoireeIds, setMyDemandesSoireeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [mySoirees, setMySoirees] = useState([]);
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setCurrentUserRole(prof?.role);
        // Check fav
        const { data: fav } = await supabase.from('favoris').select('id').eq('user_id', user.id).eq('favorited_id', id).single();
        if (fav) setIsFav(true);
        // Load soirées for propose
        if (prof?.role === 'etablissement') {
          const { data: soirs } = await supabase.from('soirees').select('id, titre, date_soiree, heure_debut, heure_fin, cachet').eq('etablissement_id', user.id).eq('status', 'draft');
          setMySoirees(soirs || []);
        }
      }
 
      // Load artist
      const { data: artist } = await supabase.from('artistes').select('*').eq('id', id).single();
      if (artist) {
        setRole('artiste');
        setProfileData(artist);
        // Reviews with venue name
        const { data: reviews } = await supabase.from('avis').select('*, soirees(titre, date_soiree, etablissement_id, etablissements:etablissement_id(nom))').eq('reviewed_id', id).order('created_at', { ascending: false });
        setAvis(reviews || []);
        const { data: dems } = await supabase.from('demandes').select('*, soirees(*, etablissements:etablissement_id(nom, ville))').eq('artiste_id', id).eq('status', 'accepted');
        setPastSoirees((dems || []).filter(d => d.soirees?.date_soiree < new Date().toISOString().split('T')[0]).sort((a, b) => b.soirees.date_soiree.localeCompare(a.soirees.date_soiree)));
        setLoading(false);
        return;
      }
 
      // Load venue
      const { data: venue } = await supabase.from('etablissements').select('*').eq('id', id).single();
      if (venue) {
        setRole('etablissement');
        setProfileData(venue);
        const { data: reviews } = await supabase.from('avis').select('*, soirees(titre, date_soiree)').eq('reviewed_id', id).order('created_at', { ascending: false });
        setAvis(reviews || []);
        const { data: soirs } = await supabase.from('soirees').select('*').eq('etablissement_id', id);
        const todayStr = new Date().toISOString().split('T')[0];
        setPastSoirees((soirs || []).filter(s => s.status === 'confirmed' && s.date_soiree < todayStr).sort((a, b) => b.date_soiree.localeCompare(a.date_soiree)));
        // Upcoming soirées (draft or confirmed, future dates)
        const upcoming = (soirs || []).filter(s => s.date_soiree >= todayStr).sort((a, b) => a.date_soiree.localeCompare(b.date_soiree));
        setUpcomingSoirees(upcoming);
      }
      setLoading(false);
    }
    load();
  }, [id]);
 
  const toggleFav = async () => {
    if (!currentUserId) return;
    if (isFav) {
      await supabase.from('favoris').delete().eq('user_id', currentUserId).eq('favorited_id', id);
      setIsFav(false);
    } else {
      await supabase.from('favoris').insert({ user_id: currentUserId, favorited_id: id });
      setIsFav(true);
    }
  };
 
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
  if (!profileData) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">🔍</div><h2 className="font-display text-xl font-bold mb-2">Profil introuvable</h2><Link href="/explorer" className="text-sm text-accent hover:underline">Retour</Link></div></div>;
 
  const avgRating = avis.length > 0 ? (avis.reduce((s, a) => s + a.note, 0) / avis.length).toFixed(1) : null;
  const formatD = (d) => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); const mn = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']; return `${dt.getDate()} ${mn[dt.getMonth()]} ${dt.getFullYear()}`; };
  const isSelf = currentUserId === id;
  const eqMap = {}; EQUIPEMENTS.forEach(e => { eqMap[e.id] = e; });
 
  if (role === 'artiste') return <ArtistProfile data={profileData} avis={avis} avgRating={avgRating} pastSoirees={pastSoirees} formatD={formatD} isSelf={isSelf} id={id} isFav={isFav} toggleFav={toggleFav} currentUserId={currentUserId} currentUserRole={currentUserRole} mySoirees={mySoirees} supabase={supabase} />;
  return <VenueProfile data={profileData} avis={avis} avgRating={avgRating} pastSoirees={pastSoirees} formatD={formatD} isSelf={isSelf} id={id} isFav={isFav} toggleFav={toggleFav} currentUserId={currentUserId} eqMap={eqMap} upcomingSoirees={upcomingSoirees} currentUserRole={currentUserRole} supabase={supabase} />;
}
 
function ArtistProfile({ data, avis, avgRating, pastSoirees, formatD, isSelf, id, isFav, toggleFav, currentUserId, currentUserRole, mySoirees, supabase }) {
  const [showPropose, setShowPropose] = useState(false);
  const [selectedSoiree, setSelectedSoiree] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [proposeSent, setProposeSent] = useState(false);
 
  const sendDemande = async () => {
    if (!selectedSoiree) return;
    setSending(true);
    await supabase.from('demandes').insert({ soiree_id: selectedSoiree, etablissement_id: currentUserId, artiste_id: id, status: 'pending', message: message.trim() || null });
    setSending(false);
    setProposeSent(true);
    setShowPropose(false);
    setMessage('');
    setSelectedSoiree(null);
  };
 
  const fmtD = (d) => { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); const mn = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin']; return `${dt.getDate()} ${mn[dt.getMonth()]}`; };
 
  return (
    <div className="min-h-screen px-4 py-16 sm:py-20">
      <div className="max-w-2xl mx-auto">
        {/* HERO */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-5 animate-fade-up">
          <div className="h-32 bg-gradient-to-br from-accent/20 via-accent/5 to-bg-mid" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end justify-between">
              <div className="w-20 h-20 rounded-full bg-bg-card border-4 border-bg-card flex items-center justify-center text-3xl overflow-hidden">
                {data.photo_url ? <img src={data.photo_url} alt={data.nom_scene} className="w-full h-full object-cover" /> : <span>{ARTIST_EMOJIS[data.type_artiste] || '🎵'}</span>}
              </div>
              {currentUserId && !isSelf && (
                <button onClick={toggleFav} className={`text-2xl transition hover:scale-110 ${isFav ? 'text-red-400' : 'text-dim/30 hover:text-red-400/50'}`}>{isFav ? '❤️' : '🤍'}</button>
              )}
            </div>
            <div className="mt-3">
              <h1 className="font-display text-2xl font-bold">{data.nom_scene}</h1>
              <p className="text-sm text-accent font-medium mt-0.5">{data.type_artiste} · 📍 {data.ville}</p>
              {avgRating && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-amber-400 font-semibold">{avgRating}</span>
                  <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span>
                  <span className="text-xs text-dim">({avis.length} avis)</span>
                </div>
              )}
            </div>
            {isSelf && <Link href="/onboarding/artiste" className="text-xs text-dim hover:text-muted mt-3 inline-block">✏️ Modifier mon profil</Link>}
          </div>
        </div>
 
        {/* BIO */}
        {data.bio && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}><h2 className="text-sm font-medium mb-2">À propos</h2><p className="text-sm text-muted leading-relaxed">{data.bio}</p></div>}
 
        {/* STYLES */}
        {data.styles?.length > 0 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.08s'}}><h2 className="text-sm font-medium mb-2">Styles</h2><div className="flex flex-wrap gap-2">{data.styles.map(s => (<span key={s} className="text-xs px-3 py-1.5 rounded-full bg-accent/10 border border-accent/15 text-accent">{s}</span>))}</div></div>}
 
        {/* DISPOS */}
        {data.disponibilites?.length > 0 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.1s'}}><h2 className="text-sm font-medium mb-2">Disponibilités</h2><div className="flex gap-2">{data.disponibilites.map(j => (<span key={j} className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/15 text-accent font-medium">{j}</span>))}</div></div>}
 
        {/* CONTACT + PROPOSE */}
        {!isSelf && currentUserId && (
          <div className="mb-5 animate-fade-up" style={{animationDelay:'0.11s'}}>
            <div className="flex gap-2">
              <Link href={`/messages?to=${id}&name=${encodeURIComponent(data.nom_scene)}`} className="flex-1 text-xs py-3 rounded-xl bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition text-center">📩 Contacter {data.nom_scene}</Link>
              {currentUserRole === 'etablissement' && mySoirees.length > 0 && !proposeSent && (
                <button onClick={() => setShowPropose(!showPropose)} className="flex-1 text-xs py-3 rounded-xl bg-blue/10 text-blue border border-blue/20 font-medium hover:bg-blue/20 transition">📋 Proposer une soirée</button>
              )}
              {proposeSent && <span className="flex-1 text-xs py-3 rounded-xl bg-green-400/10 text-green-400 border border-green-400/20 text-center">✓ Demande envoyée !</span>}
            </div>
            {showPropose && (
              <div className="mt-3 bg-bg border border-blue/20 rounded-xl p-4 animate-fade-up space-y-3">
                <div className="text-xs font-medium text-blue">📋 Choisissez une soirée</div>
                <div className="space-y-1.5">{mySoirees.map(s => (
                  <button key={s.id} onClick={() => setSelectedSoiree(s.id)} className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition ${selectedSoiree === s.id ? 'bg-blue/10 border-blue/30 text-blue' : 'border-border hover:bg-bg-card text-muted'}`}>
                    <span className="font-medium">{s.titre}</span><span className="text-dim ml-2">{fmtD(s.date_soiree)} · {s.heure_debut}–{s.heure_fin}</span>{s.cachet && <span className="text-accent ml-1">· {s.cachet}€</span>}
                  </button>
                ))}</div>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Message (optionnel)" className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-white focus:border-blue transition placeholder:text-dim" />
                <div className="flex gap-2">
                  <button onClick={() => { setShowPropose(false); setSelectedSoiree(null); }} className="text-xs px-4 py-2 rounded-lg border border-border text-muted">Annuler</button>
                  <button onClick={sendDemande} disabled={!selectedSoiree || sending} className="flex-1 text-xs py-2 rounded-lg bg-blue text-black font-medium disabled:opacity-30">{sending ? '...' : '📨 Envoyer'}</button>
                </div>
              </div>
            )}
          </div>
        )}
 
        {/* SOCIAL LINKS */}
        {(data.soundcloud || data.instagram || data.tiktok || data.youtube || data.spotify) && (
          <div className="mb-5 animate-fade-up" style={{animationDelay:'0.12s'}}>
            <h2 className="text-sm font-medium mb-2">Liens</h2>
            <div className="flex flex-wrap gap-2">
              {data.soundcloud && <a href={data.soundcloud.startsWith('http') ? data.soundcloud : `https://${data.soundcloud}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/15 text-orange-400 hover:bg-orange-500/20 transition">☁️ SoundCloud</a>}
              {data.instagram && <a href={`https://instagram.com/${data.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-pink-500/10 border border-pink-500/15 text-pink-400 hover:bg-pink-500/20 transition">📸 Instagram</a>}
              {data.tiktok && <a href={`https://tiktok.com/@${data.tiktok.replace('@', '')}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">🎵 TikTok</a>}
              {data.youtube && <a href={data.youtube.startsWith('http') ? data.youtube : `https://${data.youtube}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500/20 transition">▶️ YouTube</a>}
              {data.spotify && <a href={data.spotify.startsWith('http') ? data.spotify : `https://${data.spotify}`} target="_blank" className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/15 text-green-400 hover:bg-green-500/20 transition">🎧 Spotify</a>}
            </div>
          </div>
        )}
 
        {/* PAST SOIREES */}
        {pastSoirees.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{animationDelay:'0.15s'}}>
            <h2 className="text-sm font-medium mb-2">Soirées réalisées ({pastSoirees.length})</h2>
            <div className="space-y-2">{pastSoirees.slice(0, 6).map((d, i) => (
              <div key={i} className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3">
                <div className="text-center w-10 flex-shrink-0"><div className="text-sm font-semibold">{new Date(d.soirees.date_soiree + 'T00:00:00').getDate()}</div><div className="text-[9px] text-dim uppercase">{['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][new Date(d.soirees.date_soiree + 'T00:00:00').getMonth()]}</div></div>
                <div className="flex-1 min-w-0"><div className="text-xs font-medium">{d.soirees.titre}</div><div className="text-[10px] text-dim">{d.soirees.etablissements?.nom} · {d.soirees.etablissements?.ville}</div></div>
              </div>
            ))}</div>
          </div>
        )}
 
        {/* AVIS */}
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.18s'}}>
          <h2 className="text-sm font-medium mb-3">Avis ({avis.length}){avgRating && <span className="text-amber-400 ml-2">★ {avgRating}</span>}</h2>
          {avis.length === 0 ? <div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-2xl mb-2">⭐</div><p className="text-xs text-dim">Aucun avis</p></div> : (
            <div className="space-y-2">{avis.map(a => (
              <div key={a.id} className="bg-bg border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-sm">{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
                    {a.soirees?.etablissements?.nom && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">🍸 {a.soirees.etablissements.nom}</span>}
                  </div>
                  <div className="text-[10px] text-dim">{a.soirees?.titre} · {formatD(a.soirees?.date_soiree)}</div>
                </div>
                {a.commentaire && <p className="text-xs text-muted leading-relaxed">{a.commentaire}</p>}
              </div>
            ))}</div>
          )}
        </div>
 
        <div className="text-center"><Link href="/explorer" className="text-xs text-dim hover:text-muted transition">← Retour</Link></div>
      </div>
    </div>
  );
}
 
function SoireeCard({ soiree, formatD, currentUserId, currentUserRole, venueId, supabase }) {
  const [showPostuler, setShowPostuler] = useState(false);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const s = soiree;
 
  const handlePostuler = async () => {
    if (!currentUserId) return;
    setSending(true);
    await supabase.from('demandes').insert({
      soiree_id: s.id, etablissement_id: venueId, artiste_id: currentUserId,
      status: 'pending', message: msg.trim() || null, initiated_by: 'artiste',
    });
    const convId = [currentUserId, venueId].sort().join('_');
    const autoMsg = msg.trim()
      ? `🎤 Candidature pour "${s.titre}" — ${msg.trim()}`
      : `🎤 Je postule pour votre soirée "${s.titre}" !`;
    await supabase.from('messages').insert({
      conversation_id: convId, sender_id: currentUserId, receiver_id: venueId, content: autoMsg, read: false,
    });
    setSending(false);
    setSent(true);
    setShowPostuler(false);
    setMsg('');
  };
 
  const statusLabel = s.status === 'confirmed' ? 'Confirmé' : 'Ouvert';
  const statusClass = s.status === 'confirmed' ? 'bg-green-400/10 border-green-400/20 text-green-400' : 'bg-accent/10 border-accent/20 text-accent';
 
  return (
    <div className="bg-bg border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-medium">{s.titre}</div>
          <div className="text-[10px] text-dim mt-0.5">📅 {formatD(s.date_soiree)} · {s.heure_debut}–{s.heure_fin}</div>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${statusClass}`}>{statusLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {s.ambiance && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">🎵 {s.ambiance}</span>}
        {s.cachet && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">💰 {s.cachet}€{s.moyen_paiement ? ` · ${s.moyen_paiement}` : ''}</span>}
        {s.nb_artistes && <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-card text-dim">👥 {s.nb_artistes} artiste{s.nb_artistes > 1 ? 's' : ''}</span>}
      </div>
      {s.description && <p className="text-xs text-muted mt-2">{s.description}</p>}
 
      {currentUserRole === 'artiste' && s.status === 'draft' && !sent && (
        <div className="mt-3">
          {!showPostuler ? (
            <button onClick={() => setShowPostuler(true)} className="w-full text-xs py-2.5 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition">🎤 Postuler pour cette soirée</button>
          ) : (
            <div className="bg-bg-card border border-accent/20 rounded-lg p-3 space-y-2 animate-fade-up">
              <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message personnalisé (optionnel)" className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-dim" />
              <div className="flex gap-2">
                <button onClick={() => setShowPostuler(false)} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted">Annuler</button>
                <button onClick={handlePostuler} disabled={sending} className="flex-1 text-xs py-1.5 rounded-lg bg-accent text-black font-medium disabled:opacity-50">{sending ? '...' : '📨 Envoyer ma candidature'}</button>
              </div>
            </div>
          )}
        </div>
      )}
      {sent && <div className="mt-3 text-xs text-center text-green-400 bg-green-400/10 rounded-lg py-2">✓ Candidature envoyée !</div>}
    </div>
  );
}
 
function SoireeApplyCard({ soiree, dt, alreadyApplied, currentUserId, currentUserRole, etablissementId, supabase, onApplied }) {
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
 
  const handlePostuler = async () => {
    setSending(true);
    await supabase.from('demandes').insert({
      soiree_id: soiree.id,
      etablissement_id: etablissementId,
      artiste_id: currentUserId,
      status: 'pending',
      message: msg.trim() || null,
      initiated_by: 'artiste',
    });
    const convId = [currentUserId, etablissementId].sort().join('_');
    await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: currentUserId,
      receiver_id: etablissementId,
      content: msg.trim() ? `🎤 Candidature pour "${soiree.titre}" — ${msg.trim()}` : `🎤 Je postule pour votre soirée "${soiree.titre}" !`,
      read: false,
    });
    setSending(false);
    setSent(true);
    onApplied();
  };
 
  const mn = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
 
  if (sent || alreadyApplied) return (
    <div className="bg-bg border border-green-400/20 rounded-xl p-4 flex items-center gap-4">
      <div className="text-center w-12 flex-shrink-0"><div className="text-lg font-semibold">{dt.getDate()}</div><div className="text-[9px] text-dim uppercase">{mn[dt.getMonth()]}</div></div>
      <div className="flex-1"><div className="text-sm font-medium">{soiree.titre}</div><div className="text-[10px] text-dim">{soiree.heure_debut}–{soiree.heure_fin}{soiree.ambiance && ` · ${soiree.ambiance}`}{soiree.cachet && ` · ${soiree.cachet}€`}</div></div>
      <span className="text-xs text-green-400 flex-shrink-0">✓ Candidature envoyée</span>
    </div>
  );
 
  return (
    <div className="bg-bg border border-border rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="text-center w-12 flex-shrink-0"><div className="text-lg font-semibold">{dt.getDate()}</div><div className="text-[9px] text-dim uppercase">{mn[dt.getMonth()]}</div></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{soiree.titre}</div>
          <div className="text-[10px] text-dim">{soiree.heure_debut}–{soiree.heure_fin}{soiree.ambiance && ` · ${soiree.ambiance}`}</div>
          <div className="flex items-center gap-2 mt-1">
            {soiree.cachet && <span className="text-[10px] text-accent font-medium">💰 {soiree.cachet}€{soiree.moyen_paiement && ` · ${soiree.moyen_paiement}`}</span>}
            {soiree.nb_artistes && soiree.nb_artistes > 1 && <span className="text-[10px] text-dim">{soiree.nb_artistes} artistes recherchés</span>}
          </div>
        </div>
        {currentUserRole === 'artiste' && currentUserId && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs px-3 py-2 rounded-lg bg-accent/10 text-accent border border-accent/20 font-medium hover:bg-accent/20 transition flex-shrink-0">Postuler</button>
        )}
      </div>
      {showForm && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-up space-y-2">
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Message personnalisé (optionnel)" className="w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-xs text-white focus:border-accent transition placeholder:text-dim" />
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setMsg(''); }} className="text-xs px-4 py-2 rounded-lg border border-border text-muted">Annuler</button>
            <button onClick={handlePostuler} disabled={sending} className="flex-1 text-xs py-2 rounded-lg bg-accent text-black font-medium disabled:opacity-50">{sending ? '...' : '📨 Envoyer ma candidature'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
 
function VenueProfile({ data, avis, avgRating, pastSoirees, formatD, isSelf, id, isFav, toggleFav, currentUserId, eqMap, upcomingSoirees, currentUserRole, myDemandesSoireeIds, setMyDemandesSoireeIds, supabase }) {
  return (
    <div className="min-h-screen px-4 py-16 sm:py-20">
      <div className="max-w-2xl mx-auto">
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-5 animate-fade-up">
          {data.photos?.length > 0 ? <div className="h-48 overflow-hidden"><img src={data.photos[0]} alt={data.nom} className="w-full h-full object-cover" /></div> : <div className="h-32 bg-gradient-to-br from-blue/20 via-blue/5 to-bg-mid" />}
          <div className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold">{data.nom}</h1>
                <p className="text-sm text-dim mt-0.5">📍 {data.adresse || data.ville}</p>
                {data.capacite && <p className="text-xs text-dim mt-0.5">Capacité {data.capacite} personnes</p>}
                {avgRating && <div className="flex items-center gap-2 mt-2"><span className="text-amber-400 font-semibold">{avgRating}</span><span className="text-amber-400 text-sm">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}</span><span className="text-xs text-dim">({avis.length} avis)</span></div>}
              </div>
              <div className="flex items-center gap-2">
                {currentUserId && !isSelf && <button onClick={toggleFav} className={`text-2xl transition hover:scale-110 ${isFav ? 'text-red-400' : 'text-dim/30 hover:text-red-400/50'}`}>{isFav ? '❤️' : '🤍'}</button>}
                {isSelf && <Link href="/onboarding/etablissement" className="text-xs px-3 py-2 rounded-lg bg-bg-mid border border-border text-muted hover:text-white transition">✏️ Modifier</Link>}
              </div>
            </div>
          </div>
        </div>
 
        {/* CONTACT */}
        {!isSelf && currentUserId && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.03s'}}><Link href={`/messages?to=${id}&name=${encodeURIComponent(data.nom)}`} className="w-full text-xs py-3 rounded-xl bg-blue/10 text-blue border border-blue/20 font-medium hover:bg-blue/20 transition block text-center">📩 Contacter {data.nom}</Link></div>}
 
        {/* UPCOMING SOIRÉES */}
        {upcomingSoirees.length > 0 && (
          <div className="mb-5 animate-fade-up" style={{animationDelay:'0.04s'}}>
            <h2 className="text-sm font-medium mb-3">🎵 Soirées à venir ({upcomingSoirees.length})</h2>
            <div className="space-y-2">
              {upcomingSoirees.map(s => (
                <SoireeCard key={s.id} soiree={s} formatD={formatD} currentUserId={currentUserId} currentUserRole={currentUserRole} venueId={id} supabase={supabase} />
              ))}
            </div>
          </div>
        )}
 
        {data.photos?.length > 1 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.05s'}}><h2 className="text-sm font-medium mb-2">Photos</h2><div className="flex gap-2 overflow-x-auto pb-1">{data.photos.map((p, i) => (<div key={i} className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-bg-card"><img src={p} alt="" className="w-full h-full object-cover" /></div>))}</div></div>}
 
        {data.type_etablissement?.length > 0 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.08s'}}><h2 className="text-sm font-medium mb-2">Type</h2><div className="flex flex-wrap gap-2">{data.type_etablissement.map(t => (<span key={t} className="text-xs px-3 py-1.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{t}</span>))}</div></div>}
 
        {data.ambiances?.length > 0 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.1s'}}><h2 className="text-sm font-medium mb-2">Ambiances</h2><div className="flex flex-wrap gap-2">{data.ambiances.map(a => (<span key={a} className="text-xs px-3 py-1.5 rounded-full bg-blue/10 border border-blue/15 text-blue">{a}</span>))}</div></div>}
 
        {data.equipements?.length > 0 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.12s'}}><h2 className="text-sm font-medium mb-2">Équipement</h2><div className="flex flex-wrap gap-2">{data.equipements.map(eq => { const e = eqMap[eq]; return <span key={eq} className="text-xs px-3 py-1.5 rounded-full bg-bg-hover text-muted">{e?.icon} {e?.label || eq}</span>; })}</div></div>}
 
        {data.site_web && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.14s'}}><a href={data.site_web.startsWith('http') ? data.site_web : `https://${data.site_web}`} target="_blank" className="inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-lg bg-blue/10 border border-blue/15 text-blue hover:bg-blue/20 transition">🌐 {data.site_web}</a></div>}
 
        {/* UPCOMING SOIRÉES */}
 
        pastSoirees.length > 0 && <div className="mb-5 animate-fade-up" style={{animationDelay:'0.16s'}}><h2 className="text-sm font-medium mb-2">Soirées organisées ({pastSoirees.length})</h2><div className="space-y-2">{pastSoirees.slice(0, 6).map((s, i) => (<div key={i} className="bg-bg border border-border rounded-lg p-3 flex items-center gap-3"><div className="text-center w-10 flex-shrink-0"><div className="text-sm font-semibold">{new Date(s.date_soiree + 'T00:00:00').getDate()}</div><div className="text-[9px] text-dim uppercase">{['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'][new Date(s.date_soiree + 'T00:00:00').getMonth()]}</div></div><div className="flex-1"><div className="text-xs font-medium">{s.titre}</div><div className="text-[10px] text-dim">{s.ambiance} · {s.heure_debut}–{s.heure_fin}</div></div></div>))}</div></div>}
 
        <div className="mb-5 animate-fade-up" style={{animationDelay:'0.2s'}}>
          <h2 className="text-sm font-medium mb-3">Avis ({avis.length}){avgRating && <span className="text-amber-400 ml-2">★ {avgRating}</span>}</h2>
          {avis.length === 0 ? <div className="bg-bg border border-border rounded-xl p-6 text-center"><div className="text-2xl mb-2">⭐</div><p className="text-xs text-dim">Aucun avis</p></div> : (
            <div className="space-y-2">{avis.map(a => (
              <div key={a.id} className="bg-bg border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2"><div className="text-amber-400 text-sm">{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</div><div className="text-[10px] text-dim">{a.soirees?.titre} · {formatD(a.soirees?.date_soiree)}</div></div>
                {a.commentaire && <p className="text-xs text-muted leading-relaxed">{a.commentaire}</p>}
              </div>
            ))}</div>
          )}
        </div>
 
        <div className="text-center"><Link href="/explorer" className="text-xs text-dim hover:text-muted transition">← Retour</Link></div>
      </div>
    </div>
  );
}
 
