'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export function AuthModal() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/chat`,
          },
        });
        if (error) throw error;
        
        alert('Check your email to confirm your account!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="mech-panel max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="neon-text neon-pulse text-4xl font-barlow font-bold mb-2">
            AILEEN MACHINA
          </h1>
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Create neural link' : 'Establish connection'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-metal-dark border border-metal-accent rounded text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-metal-dark border border-metal-accent rounded text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-neon-red text-sm p-3 bg-metal-dark rounded border border-neon-red/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="metal-button w-full"
          >
            {loading ? 'CONNECTING...' : isSignUp ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-neon-cyan text-sm hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </div>

        <div className="text-center pt-4 border-t border-metal-accent">
          <a
            href="/"
            className="text-gray-400 text-sm hover:text-neon-cyan transition"
          >
            ← Back to main site
          </a>
        </div>
      </div>
    </div>
  );
}
