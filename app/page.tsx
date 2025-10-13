import Logo from '@/components/brand/Logo';
import { redirect } from 'next/navigation';

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  
  // If there's a code parameter, redirect to auth callback
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}&next=/dashboard`);
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <Logo />
        <a className="text-sm underline" href="/auth/sign-in">Sign in</a>
      </div>
      <h1 className="text-2xl font-semibold mt-8">Welcome to Filevo</h1>
      <p className="text-gray-600">Secure document requests for property managers.</p>
    </main>
  );
}
