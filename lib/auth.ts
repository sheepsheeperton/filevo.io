import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export async function requireUser() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/auth/sign-in');
  
  // Ensure user has a profile
  const { error: profileError } = await db
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    const { error: insertError } = await db
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'manager'
      });

    if (insertError) {
      console.error('Error creating profile:', insertError);
      throw new Error('Failed to create user profile');
    }
  } else if (profileError) {
    console.error('Error fetching profile:', profileError);
    throw new Error('Failed to fetch user profile');
  }

  return user;
}

