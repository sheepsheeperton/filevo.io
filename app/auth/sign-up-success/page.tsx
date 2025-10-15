import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up! A confirmation email has been sent to your inbox. 
                Please check your email and click the confirmation link to activate your account.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Don&apos;t see the email? Check your spam folder or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
