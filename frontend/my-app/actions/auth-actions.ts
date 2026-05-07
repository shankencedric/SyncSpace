'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server' 
import { cookies } from 'next/headers'
import { getWorkingUrl_Vercel } from '@/utils/url-helper'
import { get } from 'http'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) redirect('/login?error=invalid_credentials')
  
  revalidatePath('/', 'layout')
  redirect('/offices')
}

export async function register(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name } // This maps exactly to new.raw_user_meta_data->>'name' in the SQL trigger
    }
  })

  if (error) redirect('/login?error=Could not register')
  
  revalidatePath('/', 'layout')
  redirect('/offices')
}

/**
 * Authenticates the user with Google OAuth.
 * 
 * Note: this is an UPSERT operation (UPDATE if exists, INSERT if not).
 * Basically, login + register in one action.
 */
export async function authWithGoogle() { 
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  console.log({VERCEL_URL: process.env.VERCEL_URL, VERCEL_URL_FALLBACK: process.env.VERCEL_URL_FALLBACK})
  const url = getWorkingUrl_Vercel() + '/oauth-callback'
  console.log('Redirect URL for Google OAuth:', url)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: url, 
    },
  })

  if (error) {
    redirect('/login?error=Could not authenticate with Google')
  }

  // Supabase generates a secure Google URL. We redirect the user's browser to it.
  if (data.url) {
    redirect(data.url)
  }
}