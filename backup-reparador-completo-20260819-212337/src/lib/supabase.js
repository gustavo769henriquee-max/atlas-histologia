import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)

export const ADMIN_USER_ID =
  'a59b0b71-111b-4c2e-9deb-39018d5ffd75'

export async function isAdmin() {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser()

  return !!user &&
    user.id === ADMIN_USER_ID

}

