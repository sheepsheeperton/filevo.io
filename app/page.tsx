import { redirect } from 'next/navigation';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  
  // If there's a code parameter, redirect to auth callback (for OAuth flows)
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}&next=/dashboard`);
  }

  // INTENTIONAL: Root URL redirects directly to sign-in for simplified entry experience
  // This removes the need for a separate landing page and streamlines user onboarding
  redirect('/auth/sign-in');
}
