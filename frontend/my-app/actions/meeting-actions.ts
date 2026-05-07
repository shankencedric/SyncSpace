'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

type TokenResponse = {
  token?: string
  detail?: string
}

/** Logic for starting a meeting within a session */
export async function startMeeting(sessionId: string) {
  const supabase = createClient(await cookies())

  const { data, error } = await supabase
    .from('meetings')
    .insert({ session_id: sessionId})
    .select()
    .single()

  if (error) throw error
  
  return data
}

/** Logic for ending a meeting within a session */
export async function endMeeting(sessionId: string) {
  const supabase = createClient(await cookies())

  const { data, error } = await supabase
    .from('meetings')
    .update({ ended_at: new Date().toISOString() })
    .eq('session_id', sessionId)

  if (error) throw error
  return data
}

export async function getLiveKitToken(roomName: string, participantName: string) {
  const trimmedRoomName = roomName.trim()
  const trimmedParticipantName = participantName.trim()

  if (!trimmedRoomName || !trimmedParticipantName) {
    throw new Error('Room name and participant name are required.')
  }

  const tokenApiBase = (process.env.NEXT_PUBLIC_TOKEN_API_URL ?? 'http://localhost:8000')
    .trim()
    .replace(/\/+$/, '')

  const response = await fetch(
    `${tokenApiBase}/get-token?room_name=${encodeURIComponent(trimmedRoomName)}&participant_name=${encodeURIComponent(trimmedParticipantName)}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  )

  let payload: TokenResponse = {}
  try {
    payload = (await response.json()) as TokenResponse
  } catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(payload.detail ?? 'Failed to request a LiveKit token.')
  }

  if (!payload.token) {
    throw new Error('Token API returned no token.')
  }

  return { token: payload.token }
}