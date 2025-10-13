import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export async function requireUser() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  return user;
}

