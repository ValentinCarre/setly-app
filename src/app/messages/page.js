'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase';
 
function MessagesContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('to');
  const targetName = searchParams.get('name');
 
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactProfiles, setContactProfiles] = useState({});
  const bottomRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();
 
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
 
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
 
      // Load all messages for this user
      const { data: msgs } = await supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
 
      // Group by conversation
      const convMap = {};
      (msgs || []).forEach(m => {
        if (!convMap[m.conversation_id]) convMap[m.conversation_id] = [];
        convMap[m.conversation_id].push(m);
      });
 
      // Build conversation list
      const convList = Object.entries(convMap).map(([convId, msgs]) => {
        const lastMsg = msgs[msgs.length - 1];
        const otherId = lastMsg.sender_id === user.id ? lastMsg.receiver_id : lastMsg.sender_id;
        const unread = msgs.filter(m => m.receiver_id === user.id && !m.read).length;
        return { id: convId, otherId, lastMsg, messages: msgs, unread };
      }).sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at));
 
      setConversations(convList);
 
      // Load contact names
      const otherIds = [...new Set(convList.map(c => c.otherId))];
      if (targetId) otherIds.push(targetId);
      
      const profiles = {};
      for (const oid of otherIds) {
        const { data: art } = await supabase.from('artistes').select('nom_scene, photo_url, type_artiste').eq('id', oid).single();
        if (art) { profiles[oid] = { name: art.nom_scene, photo: art.photo_url, type: art.type_artiste, role: 'artiste' }; continue; }
        const { data: etab } = await supabase.from('etablissements').select('nom, photos').eq('id', oid).single();
        if (etab) { profiles[oid] = { name: etab.nom, photo: etab.photos?.[0], role: 'etablissement' }; }
      }
      setContactProfiles(profiles);
 
      // If target specified, open or create that conversation
      if (targetId) {
        const existingConv = convList.find(c => c.otherId === targetId);
        if (existingConv) {
          setActiveConv(existingConv.id);
          setMessages(existingConv.messages);
        } else {
          const convId = [user.id, targetId].sort().join('_');
          setActiveConv(convId);
          setMessages([]);
        }
      } else if (convList.length > 0) {
        setActiveConv(convList[0].id);
        setMessages(convList[0].messages);
      }
 
      setLoading(false);
    }
    load();
  }, []);
 
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 
  useEffect(() => {
    if (!activeConv || !user) return;
    // Mark messages as read
    const unread = messages.filter(m => m.receiver_id === user.id && !m.read);
    if (unread.length > 0) {
      unread.forEach(m => {
        supabase.from('messages').update({ read: true }).eq('id', m.id).then(() => {});
      });
    }
  }, [activeConv, messages]);
 
  const openConversation = (conv) => {
    setActiveConv(conv.id);
    setMessages(conv.messages);
  };
 
  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConv || !user) return;
    setSending(true);
 
    const otherId = activeConv.includes('_')
      ? activeConv.split('_').find(id => id !== user.id)
      : conversations.find(c => c.id === activeConv)?.otherId;
 
    if (!otherId) { setSending(false); return; }
 
    const msg = {
      conversation_id: activeConv,
      sender_id: user.id,
      receiver_id: otherId,
      content: newMsg.trim(),
      read: false,
    };
 
    const { data, error } = await supabase.from('messages').insert(msg).select().single();
 
    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setNewMsg('');
 
      // Update conversations list
      setConversations(prev => {
        const existing = prev.find(c => c.id === activeConv);
        if (existing) {
          return prev.map(c => c.id === activeConv ? { ...c, lastMsg: data, messages: [...c.messages, data] } : c);
        }
        return [{ id: activeConv, otherId, lastMsg: data, messages: [data], unread: 0 }, ...prev];
      });
    }
    setSending(false);
  };
 
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
 
  const getContactName = (id) => contactProfiles[id]?.name || 'Utilisateur';
  const getContactPhoto = (id) => contactProfiles[id]?.photo;
  const getContactRole = (id) => contactProfiles[id]?.role;
 
  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Hier ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };
 
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;
 
  const activeOtherId = activeConv?.includes('_')
    ? activeConv.split('_').find(id => id !== user?.id)
    : conversations.find(c => c.id === activeConv)?.otherId;
 
  return (
    <div className="min-h-screen px-4 py-20">
      <div className="max-w-4xl mx-auto animate-fade-up">
        <h1 className="font-display text-2xl font-bold mb-5 flex items-center gap-2">💬 Messages</h1>
 
        <div className="grid md:grid-cols-[280px_1fr] gap-4" style={{ minHeight: '500px' }}>
          {/* CONVERSATION LIST */}
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="text-xs text-dim font-medium uppercase tracking-wider">Conversations</div>
            </div>
            {conversations.length === 0 && !targetId ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-xs text-dim">Aucune conversation</p>
                <Link href="/explorer" className="text-xs text-accent hover:underline mt-2 inline-block">Explorer les artistes</Link>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto">
                {targetId && !conversations.find(c => c.otherId === targetId) && (
                  <div className={`flex items-center gap-3 p-3 cursor-pointer transition border-l-2 ${activeConv?.includes(targetId) ? 'bg-bg-hover border-accent' : 'border-transparent hover:bg-bg-hover'}`}
                    onClick={() => { const convId = [user.id, targetId].sort().join('_'); setActiveConv(convId); setMessages([]); }}>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                      {getContactPhoto(targetId) ? <img src={getContactPhoto(targetId)} alt="" className="w-full h-full object-cover" /> : (getContactRole(targetId) === 'artiste' ? '🎧' : '🍸')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{targetName || getContactName(targetId)}</div>
                      <div className="text-[10px] text-accent">Nouvelle conversation</div>
                    </div>
                  </div>
                )}
                {conversations.map(conv => (
                  <div key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition border-l-2 ${activeConv === conv.id ? 'bg-bg-hover border-accent' : 'border-transparent hover:bg-bg-hover'}`}>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
                      {getContactPhoto(conv.otherId) ? <img src={getContactPhoto(conv.otherId)} alt="" className="w-full h-full object-cover" /> : (getContactRole(conv.otherId) === 'artiste' ? '🎧' : '🍸')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">{getContactName(conv.otherId)}</span>
                        {conv.unread > 0 && <span className="w-5 h-5 bg-accent text-black text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{conv.unread}</span>}
                      </div>
                      <p className="text-[11px] text-dim truncate mt-0.5">{conv.lastMsg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          {/* CHAT AREA */}
          <div className="bg-bg-card border border-border rounded-xl flex flex-col overflow-hidden">
            {activeConv && activeOtherId ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-base overflow-hidden flex-shrink-0">
                    {getContactPhoto(activeOtherId) ? <img src={getContactPhoto(activeOtherId)} alt="" className="w-full h-full object-cover" /> : (getContactRole(activeOtherId) === 'artiste' ? '🎧' : '🍸')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{getContactName(activeOtherId)}</div>
                    <div className="text-[10px] text-dim">{getContactRole(activeOtherId) === 'artiste' ? 'Artiste' : 'Établissement'}</div>
                  </div>
                </div>
 
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-3xl mb-2">👋</div>
                      <p className="text-sm text-dim">Envoyez le premier message !</p>
                    </div>
                  )}
                  {messages.map((m, i) => {
                    const isMine = m.sender_id === user?.id;
                    return (
                      <div key={m.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine
                          ? (profile?.role === 'artiste' ? 'bg-accent/20 text-accent' : 'bg-blue/20 text-blue')
                          : 'bg-bg-hover text-muted'
                        }`}>
                          <p>{m.content}</p>
                          <div className={`text-[9px] mt-1 ${isMine ? 'text-right opacity-60' : 'opacity-40'}`}>{formatTime(m.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
 
                {/* Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={handleKeyDown}
                      className="flex-1 bg-bg border border-border rounded-xl px-4 py-2.5 text-sm text-white focus:border-accent transition placeholder:text-dim"
                      placeholder="Écrivez votre message..."
                    />
                    <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-30 ${profile?.role === 'artiste' ? 'bg-accent text-black' : 'bg-blue text-black'}`}>
                      {sending ? '...' : '➤'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-sm text-dim">Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
 
export default function Messages() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
 
