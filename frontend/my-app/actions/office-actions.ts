'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireEmployeeOrHigher, requireManagerOrHigher, requireOwner } from './utils/guard'

/**
 * `formData` should contain: 
 * - `name` :: string
 */
export async function createOffice(formData: FormData) {
    const supabase = createClient(await cookies())
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) 
      redirect('/login?error=unauthenticated')
      
    const name = formData.get('name') as string

    // 1. Create the office
    const { data: office, error: officeError } = await supabase
        .from('offices')
        .insert({ name })
        .select()
        .single()

    if (officeError) throw officeError

    // 2. Automatically make the creator an 'owner' member
    await supabase
        .from('memberships')
        .insert({
            user_id: user.id,
            office_id: office.id,
            type: 'owner'
        })

    revalidatePath('/offices')
    redirect(`/${office.id}/dashboard`)
}

export async function joinOffice(invite_code: string) {
    const supabase = createClient(await cookies())
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) 
      redirect('/login?error=unauthenticated')

    // 1 - Retrieve the office associated with the invite code
    const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select()
        .eq('invite_code', invite_code)
        .single()   

    if (invitationsError) 
      redirect('/offices?error=invalid_invite_code')

    // 2 - Add the user to the office's members
    const { error } = await supabase
        .from('memberships')
        .insert({
            user_id: user.id,
            office_id: invitations.office_id,
            type: 'regular'
        })

    if (error) throw error
    revalidatePath('/offices')
    redirect(`/${invitations.office_id}/dashboard`)
}

/**
 * Fetch offices the current user belongs to.
 *
 * @returns Offices with the user's membership role (type).
 * @throws Error if the user is not authenticated or queries fail.
 */
export async function getMyOffices(): Promise<Array<{ id: string; name: string; role: string }>> {
  const supabase = createClient(await cookies())
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=unauthenticated')

  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('office_id, type')
    .eq('user_id', user.id)

  if (membershipsError) throw membershipsError

  const officeIds = (memberships ?? []).map((m) => m.office_id).filter(Boolean)
  if (officeIds.length === 0) return []

  const { data: offices, error: officesError } = await supabase
    .from('offices')
    .select('id, name')
    .in('id', officeIds)

  if (officesError) throw officesError

  const roleByOfficeId = new Map((memberships ?? []).map((m) => [m.office_id, m.type]))
  return (offices ?? []).map((office) => ({
    id: office.id,
    name: office.name,
    role: String(roleByOfficeId.get(office.id) ?? 'regular'),
  }))
}

/**
 * Fetch rooms for a given office.
 *
 * Security: requires the caller to be an employee of the office.
 *
 * @param officeId - `offices.id`
 * @returns Rooms belonging to the office.
 * @throws Error if unauthorized or query fails.
 */
export async function getOfficeRooms(
  officeId: string,
): Promise<Array<{ id: string; name: string; type: string; owner_id: string | null }>> {
  const supabase = createClient(await cookies())
  await requireEmployeeOrHigher(supabase, officeId)

  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, type, owner_id')
    .eq('office_id', officeId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Array<{ id: string; name: string; type: string; owner_id: string | null }>
}

/**
 * Fetch members for a given office.
 *
 * Security: requires the caller to be a manager or owner of the office.
 *
 * @param officeId - `offices.id`
 * @returns Member records with minimal user profile + membership role.
 * @throws Error if unauthorized or queries fail.
 */
export async function getOfficeMembers(
  officeId: string,
): Promise<Array<{ user_id: string; role: string; user: Record<string, unknown> }>> {
  const supabase = createClient(await cookies())
  await requireManagerOrHigher(supabase, officeId)

  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('user_id, type')
    .eq('office_id', officeId)

  if (membershipsError) throw membershipsError
  const userIds = (memberships ?? []).map((m) => m.user_id).filter(Boolean)
  if (userIds.length === 0) return []

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds)

  if (usersError) throw usersError

  const userById = new Map((users ?? []).map((u) => [u.id, u as Record<string, unknown>]))
  return (memberships ?? []).map((m) => ({
    user_id: m.user_id,
    role: m.type,
    user: userById.get(m.user_id) ?? { id: m.user_id },
  }))
}

export type OfficeSpatialUser = {
  id: string
  name: string
}

type OfficeSpatialPayload = {
  currentUser: OfficeSpatialUser
  users: OfficeSpatialUser[]
}

function pickNameFromRecord(record: Record<string, unknown> | undefined): string | null {
  if (!record) return null

  const candidateKeys = ['full_name', 'name', 'display_name', 'username', 'email']
  for (const key of candidateKeys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function pickNameFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') {
    return null
  }

  const data = metadata as Record<string, unknown>
  const candidateKeys = ['name', 'full_name', 'display_name', 'username']
  for (const key of candidateKeys) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

export async function getOfficeSpatialUsers(officeId: string): Promise<OfficeSpatialPayload> {
  const supabase = createClient(await cookies())
  const authUser = await requireEmployeeOrHigher(supabase, officeId)

  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('office_id', officeId)

  if (membershipsError) throw membershipsError

  const uniqueUserIds = Array.from(
    new Set((memberships ?? []).map((membership) => membership.user_id).filter(Boolean)),
  ) as string[]

  if (!uniqueUserIds.includes(authUser.id)) {
    uniqueUserIds.push(authUser.id)
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .in('id', uniqueUserIds)

  if (usersError) throw usersError

  const userById = new Map((users ?? []).map((user) => [String(user.id), user as Record<string, unknown>]))
  const authMetadataName = pickNameFromMetadata(authUser.user_metadata)

  const currentUserName =
    authMetadataName ??
    pickNameFromRecord(userById.get(authUser.id)) ??
    authUser.email?.split('@')[0] ??
    'You'

  const usersForCanvas = uniqueUserIds
    .map((userId) => {
      const profile = userById.get(userId)
      const fallbackEmailName =
        typeof profile?.email === 'string' ? profile.email.split('@')[0] : null
      const name =
        userId === authUser.id
          ? currentUserName
          : pickNameFromRecord(profile) ?? fallbackEmailName ?? `User ${userId.slice(0, 6)}`

      return { id: userId, name }
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    currentUser: { id: authUser.id, name: currentUserName },
    users: usersForCanvas,
  }
}

/**
 * Update a member's role within an office.
 *
 * Security: requires manager or owner for the office.
 *
 * @param prevState - Previous UI state from `useActionState` (unused).
 * @param formData - Must contain:
 * - `officeId` (string)
 * - `userId` (string)
 * - `role` (string: 'regular' | 'manager' | 'owner')
 * @returns Status payload for UI feedback.
 * @throws Error if unauthorized or update fails.
 */
export async function updateMemberRole(
  _prevState: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient(await cookies())

  const officeId = String(formData.get('officeId') ?? '').trim()
  const userId = String(formData.get('userId') ?? '').trim()
  const role = String(formData.get('role') ?? '').trim()

  if (!officeId) return { ok: false, message: 'Office ID is required.' }
  if (!userId) return { ok: false, message: 'User ID is required.' }
  if (!role) return { ok: false, message: 'Role is required.' }

  await requireManagerOrHigher(supabase, officeId)

  const { error } = await supabase
    .from('memberships')
    .update({ type: role })
    .eq('office_id', officeId)
    .eq('user_id', userId)

  if (error) throw error

  revalidatePath(`/${officeId}/users`)
  return { ok: true, message: 'Role updated.' }
}

/**
 * Update office settings (currently: name).
 *
 * Security: owners only.
 */
export async function updateOfficeSettings(
  _prevState: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient(await cookies())
  const officeId = String(formData.get('officeId') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()

  if (!officeId) return { ok: false, message: 'Office ID is required.' }
  if (!name) return { ok: false, message: 'Office name is required.' }

  await requireOwner(supabase, officeId)

  const { error } = await supabase
    .from('offices')
    .update({ name })
    .eq('id', officeId)

  if (error) throw error
  revalidatePath(`/${officeId}/settings`)
  return { ok: true, message: 'Office settings updated.' }
}

/**
 * Leave an office by removing the current user's membership.
 *
 * Safety: prevents leaving if the current user is the last remaining owner.
 */
export async function leaveOffice(
  _prevState: { ok: boolean; message: string } | undefined,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient(await cookies())
  const officeId = String(formData.get('officeId') ?? '').trim()
  if (!officeId) return { ok: false, message: 'Office ID is required.' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=unauthenticated')

  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('id, type')
    .eq('office_id', officeId)
    .eq('user_id', user.id)
    .single()

  if (membershipError) throw membershipError

  if (membership.type === 'owner') {
    const { count, error: ownersCountError } = await supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('office_id', officeId)
      .eq('type', 'owner')

    if (ownersCountError) throw ownersCountError
    if ((count ?? 0) <= 1) {
      throw new Error('You are the last owner. Transfer ownership before leaving this office.')
    }
  }

  const { error: deleteError } = await supabase
    .from('memberships')
    .delete()
    .eq('id', membership.id)

  if (deleteError) throw deleteError

  revalidatePath('/offices')
  return { ok: true, message: 'You have left the office.' }
}