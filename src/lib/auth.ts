import { supabase } from './supabase'

export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // preserves the current path+query (e.g. /join?code=XXXX) so a partner
      // who clicks an invite link before logging in lands back on it after
      emailRedirectTo: window.location.href,
    },
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
