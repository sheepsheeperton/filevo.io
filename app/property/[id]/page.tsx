import { redirect } from 'next/navigation';

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Redirect to new property page location
  redirect(`/app/property/${id}`);
}

