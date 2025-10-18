import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';

export async function requireUser() {
  try {
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
        // Don't throw error, just log it and continue
        console.warn('Profile creation failed, but continuing with user');
      }
    } else if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Don't throw error, just log it and continue
      console.warn('Profile fetch failed, but continuing with user');
    }

    return user;
  } catch (error) {
    console.error('Error in requireUser:', error);
    // If there's any error, redirect to sign-in
    redirect('/auth/sign-in');
  }
}

