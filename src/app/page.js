'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
 
export default function Home() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();
 
  useEffect(() => {
    // Listen for auth state - this fires when session is restored from localStorage
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          // User is logged in — go to dashboard
          router.replace('/profil');
        } else {
          // Not logged in — show landing page
          window.location.replace('/landing.html');
        }
        setChecking(false);
      }
    });
 
    // Fallback timeout in case onAuthStateChange doesn't fire
    const timeout = setTimeout(() => {
      if (checking) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            router.replace('/profil');
          } else {
            window.location.replace('/landing.html');
          }
          setChecking(false);
        });
      }
    }, 2000);
 
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);
 
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="font-display text-3xl font-extrabold mb-4">Set<span className="text-accent">ly</span></div>
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
 
