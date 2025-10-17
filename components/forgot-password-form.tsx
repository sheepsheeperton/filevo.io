"use client";

import { cn } from "@/lib/utils";
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
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting password reset for:", email);
      
      // Use our custom reliable password reset API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log("Password reset response:", result);

      if (!response.ok) {
        throw new Error(result.message || 'Password reset failed');
      }

      setSuccess(true);
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      
      // Handle specific error cases
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
        setError("Email rate limit exceeded. Please wait a few minutes before trying again. If you continue having issues, try using a different email address or contact support.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
            
            <div className="rounded-lg border border-amber-200/20 bg-amber-50/5 p-4">
              <h4 className="font-medium text-amber-100 mb-2">Not receiving the email?</h4>
              <div className="text-sm text-amber-200/80 space-y-2">
                <p>• Check your spam/junk folder</p>
                <p>• Make sure you&apos;re checking the correct email address</p>
                <p>• Email delivery can sometimes be delayed (up to 5-10 minutes)</p>
                <p>• If you see &quot;rate limit exceeded&quot;, wait 5-10 minutes before trying again</p>
                <p>• Try using a different email address if available</p>
                <p>• If you continue having issues, contact support</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
              
              <Button asChild variant="ghost" size="sm">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword}>
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset email"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4"
                >
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
