import { supabase } from './supabase'

export interface Household {
  id: string
  name: string
  invite_code: string
  created_at: string
  created_by: string | null
}

export async function getMyHousehold(): Promise<Household | null> {
  const { data: memberships, error: membershipError } = await supabase
    .from('household_members')
    .select('household_id')
    .limit(1)

  if (membershipError) throw membershipError
  if (!memberships || memberships.length === 0) return null

  const { data: household, error: householdError } = await supabase
    .from('households')
    .select('*')
    .eq('id', memberships[0].household_id)
    .single()

  if (householdError) throw householdError
  return household
}

export async function createHousehold(householdName: string, displayName: string) {
  const { data, error } = await supabase
    .rpc('create_household', {
      household_name: householdName,
      member_display_name: displayName,
    })
    .single()

  if (error) throw error
  return data as { household_id: string; invite_code: string }
}

export async function joinHouseholdByCode(code: string, displayName: string) {
  const { data, error } = await supabase.rpc('join_household_by_code', {
    code,
    member_display_name: displayName,
  })

  if (error) throw error
  return data as string
}
