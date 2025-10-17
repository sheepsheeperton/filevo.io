'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/brand/Logo';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const searchParams = useSearchParams();

  // Check for error or success parameter from magic link verification
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    const successParam = searchParams?.get('success');
    
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    } else if (successParam) {
      // Show success message
      setSent(true);
      setEmail(''); // Clear email since we don't know which one was used
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Testing with ultra-simple API first...');
      
      // Test with ultra-simple API first
      const pingResponse = await fetch('/api/ultra-simple', {
        method: 'GET',
      });
      
      console.log('Ping GET status:', pingResponse.status);
      console.log('Ping GET ok:', pingResponse.ok);
      
      if (!pingResponse.ok) {
        throw new Error(`Ping API failed with status: ${pingResponse.status}`);
      }
      
      const pingText = await pingResponse.text();
      console.log('Ping API raw response (first 200 chars):', pingText.substring(0, 200));
      
      if (pingText.startsWith('<!DOCTYPE')) {
        console.error('Server returned HTML error page instead of JSON API response');
        console.log('Full HTML response:', pingText);
        throw new Error('API route returned HTML error page - deployment issue');
      }
      
      try {
        const pingResult = JSON.parse(pingText);
        console.log('Ping API parsed result:', pingResult);
      } catch (parseError) {
        console.error('Failed to parse ping response as JSON:', parseError);
        console.log('Response appears to be HTML, not JSON');
      }
      
      // Now test POST to test API
      console.log('Testing test POST...');
      const testResponse = await fetch('/api/test', {
        method: 'POST',
      });

      console.log('Test response status:', testResponse.status);
      console.log('Test response ok:', testResponse.ok);
      
      if (!testResponse.ok) {
        throw new Error(`Test API failed with status: ${testResponse.status}`);
      }
      
      const testText = await testResponse.text();
      console.log('Test API raw response:', testText);
      
      try {
        const testResult = JSON.parse(testText);
        console.log('Test API parsed result:', testResult);
      } catch (parseError) {
        console.error('Failed to parse test response as JSON:', parseError);
        throw new Error('Server returned HTML instead of JSON - deployment issue');
      }

      // Now try the production magic link API
      console.log('Test API works, trying production magic link API...');
      const response = await fetch('/api/auth/simple-magic-link-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!responseText) {
        throw new Error('Empty response from server');
      }

      const result = JSON.parse(responseText);

      if (!response.ok) {
        throw new Error(result.message || `Server error (${response.status})`);
      }

      console.log('Magic link sent successfully:', result);
      setSent(true);
      
      // Enable resend after 30 seconds
      setTimeout(() => setCanResend(true), 30000);

    } catch (error: unknown) {
      console.error('Magic link error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          setError('Please wait a moment before requesting another link. You can try again in a few minutes.');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setCanResend(false);
    setSent(false);
    setError(null);
    // Trigger resend by submitting the form again
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <Logo variant="full" className="justify-center h-12" />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-fg">
              Welcome to Filevo
            </h1>
            <p className="text-fg-muted text-lg">
              Secure document collection for property managers
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-border bg-surface">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl text-center text-fg">
              {sent ? 'Check your email' : 'Sign in or create account'}
            </CardTitle>
            {!sent && (
              <p className="text-sm text-fg-muted text-center">
                We&apos;ll email you a secure link to get started
              </p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6">
            {sent ? (
              /* Success State */
              <div className="space-y-4">
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-success mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-success">
                        Magic link sent!
                      </p>
                      <p className="text-sm text-fg-muted">
                        We sent a secure link to <strong className="text-fg">{email}</strong>. 
                        Click the link in your email to sign in or create your account.
                      </p>
                      <p className="text-xs text-fg-subtle">
                        The link will expire in 1 hour for security.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {canResend ? (
                    <Button 
                      onClick={handleResend}
                      variant="secondary" 
                      className="w-full"
                    >
                      Send another link
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-fg-subtle">
                        Can&apos;t find the email? Check your spam folder or try again in a moment.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setSent(false);
                      setEmail('');
                      setError(null);
                    }}
                    variant="ghost" 
                    className="w-full"
                  >
                    Use a different email
                  </Button>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="h-4 w-4 text-danger mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-danger">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-fg">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-elev border-border focus:border-brand focus:ring-brand"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-brand hover:bg-brand/90 text-white"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Sending magic link...
                    </div>
                  ) : (
                    'Send magic link'
                  )}
                </Button>
              </form>
            )}

            {/* Help Link */}
            <div className="pt-4 border-t border-border">
              <details className="group">
                <summary className="text-sm text-fg-muted hover:text-fg cursor-pointer list-none">
                  <span className="underline">Trouble receiving the email?</span>
                </summary>
                <div className="mt-3 p-3 bg-elev rounded-lg space-y-2 text-sm text-fg-muted">
                  <p>• Check your spam or junk folder</p>
                  <p>• Make sure you&apos;re checking the correct email address</p>
                  <p>• Email delivery can sometimes be delayed (up to 5-10 minutes)</p>
                  <p>• If you continue having issues, try using a different email address</p>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-fg-subtle">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Logo variant="full" className="justify-center h-12 mb-4" />
          <p className="text-fg-muted">Loading...</p>
        </div>
      </main>
    }>
      <SignInForm />
    </Suspense>
  );
}