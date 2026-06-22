import 'server-only'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.rpc('is_platform_admin')
  return data === true
}
