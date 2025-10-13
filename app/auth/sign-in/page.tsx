'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/dashboard' }});
    if (!error) setSent(true);
    else alert(error.message);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        {sent ? <p>Check your email for a magic link.</p> : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full border p-2 rounded" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
            <button className="w-full bg-black text-white p-2 rounded">Send magic link</button>
          </form>
        )}
      </div>
    </main>
  );
}

