'use client';

import { useState, useEffect } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { ChatInterface } from '@/components/ChatInterface';
import { getSupabaseClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setEnvError('Missing Supabase environment variables. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      setLoading(false);
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (envError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="mech-panel max-w-xl w-full text-center">
          <h1 className="neon-text text-2xl font-barlow mb-3">CONFIGURATION REQUIRED</h1>
          <p className="text-gray-300 text-sm">{envError}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="mech-panel">
          <div className="neon-text neon-pulse text-2xl font-barlow">
            INITIALIZING NEURAL LINK...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return <ChatInterface user={user} />;
}
