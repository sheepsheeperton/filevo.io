import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Thank you for signing up!
              </CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up! A confirmation email has been sent to your inbox. 
                Please check your email and click the confirmation link to activate your account.
              </p>
              
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  <p>Don&apos;t see the email? Try these steps:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Check your spam/junk folder</li>
                    <li>Wait a few minutes for delivery</li>
                    <li>Make sure you entered the correct email address</li>
                  </ul>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/auth/sign-in">Back to Sign In</Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm">
                    <Link href="/">Return to Home</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
