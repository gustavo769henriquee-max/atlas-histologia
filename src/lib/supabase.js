import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export const ADMIN_USER_ID =
  'a59b0b71-111b-4c2e-9deb-39018d5ffd75'

/**
 * Recupera a sessão persistida no navegador.
 * O Supabase restaura automaticamente a sessão salva no localStorage.
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Erro ao recuperar sessão:', error)
    return null
  }

  return data.session || null
}

/**
 * Recupera o usuário autenticado.
 * Mantemos getUser() para validar a identidade com o Supabase.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Erro ao recuperar usuário:', error)
    return null
  }

  return data.user || null
}

export async function isAdmin(user = null) {
  const currentUser = user || await getCurrentUser()

  return !!currentUser &&
    currentUser.id === ADMIN_USER_ID
}
