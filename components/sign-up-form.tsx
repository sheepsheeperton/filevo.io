"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Debug: Log when component mounts
  useEffect(() => {
    console.log("SignUpForm component mounted successfully");
    console.log("Current state:", { email, password, repeatPassword, isLoading, error });
    
    // Add global error handler
    const handleError = (e: ErrorEvent) => {
      console.error("Global JavaScript error:", e.error);
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [email, password, repeatPassword, isLoading, error]);

  const handleSignUp = async (e: React.FormEvent) => {
    console.log("handleSignUp called", e);
    e.preventDefault();
    console.log("Form submitted successfully");
    
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      console.log("Sign up response:", { data, error });
      
      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }
      
      // Check if user was created and needs email confirmation
      if (data.user && !data.user.email_confirmed_at) {
        // User needs to confirm email
        router.push("/auth/sign-up-success");
      } else if (data.user && data.session) {
        // User is immediately signed in (email confirmation disabled)
        router.push("/dashboard");
      } else {
        // Fallback
        router.push("/auth/sign-up-success");
      }
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              
              {/* Test button to verify button clicks work */}
              <button 
                type="button"
                onClick={() => {
                  console.log("TEST BUTTON CLICKED - Button clicks work!");
                  alert("Test button works! Check console for details.");
                }}
                className="w-full bg-red-500 text-white p-2 rounded mb-2"
              >
                TEST BUTTON (Should show alert)
              </button>
              
              {/* Simple test without any dependencies */}
              <button 
                type="button"
                onClick={() => {
                  console.log("SIMPLE TEST CLICKED");
                  setError("Simple test button works! Form state is functional.");
                }}
                className="w-full bg-green-500 text-white p-2 rounded mb-2"
              >
                SIMPLE TEST (Should show error message)
              </button>
              
              {/* Test Button component */}
              <Button 
                type="button"
                onClick={() => {
                  console.log("BUTTON COMPONENT TEST CLICKED");
                  setError("Button component works! Issue is with form submission.");
                }}
                className="w-full mb-2"
                variant="secondary"
              >
                BUTTON COMPONENT TEST
              </Button>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={false}
                onClick={() => {
                  console.log("MAIN BUTTON CLICKED - Simple test");
                  setError("Main button click handler works! Issue is in form submission logic.");
                }}
              >
                {isLoading ? "Creating an account..." : "Sign up"}
              </Button>
              
              {/* Test with disabled=false to see if disabled state is the issue */}
              <Button 
                type="button"
                className="w-full mt-2"
                disabled={false}
                onClick={() => {
                  console.log("FORCE ENABLED BUTTON CLICKED");
                  setError("Force enabled button works! Issue is with disabled state logic.");
                }}
              >
                FORCE ENABLED TEST
              </Button>
              
              {/* Debug info */}
              <div className="mt-2 p-2 bg-gray-800 text-xs text-white rounded">
                <div>Debug Info:</div>
                <div>Email: &quot;{email}&quot; ({email ? "✓" : "✗"})</div>
                <div>Password: {"*".repeat(password.length)} ({password ? "✓" : "✗"})</div>
                <div>Repeat: {"*".repeat(repeatPassword.length)} ({repeatPassword ? "✓" : "✗"})</div>
                <div>Loading: {isLoading ? "✓" : "✗"}</div>
                <div>Button Disabled: {isLoading || !email || !password || !repeatPassword ? "YES" : "NO"}</div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
