'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <div className="relative text-center pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-accent-dim border border-accent-mid rounded-full px-4 py-1.5 text-xs text-accent font-medium mb-6 animate-fade-up">
            ✨ Lancement Côte d'Azur — Inscriptions ouvertes
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            La <span className="text-accent">scène</span> la plus<br />proche est à un <span className="text-blue">swipe</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Setly connecte artistes musicaux et établissements pour organiser des soirées — simplement, gratuitement.
          </p>
          <div className="flex gap-4 justify-center flex-wrap animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/signup?role=artiste" className="flex items-center gap-2 bg-accent text-black font-semibold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition">
              🎧 Je suis artiste
            </Link>
            <Link href="/signup?role=etablissement" className="flex items-center gap-2 bg-blue text-black font-semibold px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue/30 hover:-translate-y-0.5 transition">
              🍸 Je suis un établissement
            </Link>
          </div>
          <p className="text-xs text-dim mt-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            100% gratuit · Aucun engagement
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="border-y border-border py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: '0€', label: 'Pour les artistes', color: 'text-accent' },
            { val: '0€', label: 'Pour les établissements', color: 'text-blue' },
            { val: '30s', label: "Pour s'inscrire", color: 'text-accent' },
            { val: '24h', label: 'Pour trouver un artiste', color: 'text-blue' },
          ].map((s, i) => (
            <div key={i}>
              <div className={`font-display text-3xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-xs text-dim mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-xs font-semibold text-accent bg-accent-dim px-3 py-1 rounded inline-flex items-center gap-1 mb-4 uppercase tracking-wider">En 3 étapes</div>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-12">Comment ça marche</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { num: '01', icon: '🔍', title: 'Chercher', desc: "L'établissement parcourt les artistes par style, dispo et localisation." },
            { num: '02', icon: '🤝', title: 'Matcher', desc: 'Setly suggère les meilleurs profils. Contact direct, pas d\'intermédiaire.' },
            { num: '03', icon: '🎵', title: 'Jouer', desc: "L'artiste joue, l'établissement fait salle comble. Avis après la soirée." },
          ].map((step, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 relative hover:border-accent/20 hover:-translate-y-1 transition">
              <div className="absolute top-4 right-5 font-display text-5xl font-extrabold text-accent/5">{step.num}</div>
              <div className="text-3xl mb-4">{step.icon}</div>
              <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-20 px-6">
        <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Prêt à lancer la musique ?
        </h2>
        <p className="text-muted mb-8 max-w-md mx-auto">Les 50 premiers artistes obtiennent le badge Ambassadeur — profil mis en avant à vie.</p>
        <Link href="/signup" className="inline-flex items-center gap-2 bg-accent text-black font-bold px-8 py-4 rounded-xl text-lg hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-1 transition">
          Créer mon compte gratuitement
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center">
        <div className="font-display text-lg font-bold mb-2">Set<span className="text-accent">ly</span></div>
        <p className="text-xs text-dim">© 2026 Setly. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
