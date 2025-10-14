'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Logo from '@/components/brand/Logo';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    
    const { error: authError } = await supabase.auth.signInWithOtp({ 
      email, 
      options: { 
        emailRedirectTo: `${baseUrl}/auth/confirm?next=/dashboard`
      }
    });
    
    if (!authError) {
      setSent(true);
    } else {
      setError(authError.message);
    }
    
    setIsLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-bg">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo variant="full" className="justify-center mb-6" />
          <h1 className="text-3xl font-semibold">Welcome to Filevo</h1>
          <p className="text-fg-muted mt-2">Secure document collection for property managers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Check your email!</span>
                </div>
                <p className="text-sm mt-2">
                  We sent a magic link to <strong>{email}</strong>. Click the link in the email to sign in.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                {error && (
                  <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-elev border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="you@company.com"
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !email}>
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </Button>

                <p className="text-xs text-fg-subtle text-center">
                  No password required. We&apos;ll email you a secure sign-in link.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

