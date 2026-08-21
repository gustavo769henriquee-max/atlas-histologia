import { supabase } from '../lib/supabase.js'

export function renderLogin() {
  return `
    <main class="auth-page">
      <div class="auth-card">

        <div class="auth-logo">🔬</div>

        <span class="eyebrow">ÁREA ADMINISTRATIVA</span>

        <h1>Entrar no Atlas</h1>

        <p>
          Entre com sua conta de administrador para gerenciar
          as lâminas e conteúdos.
        </p>

        <form id="login-form">

          <label>
            E-mail
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              required
            >
          </label>

          <label>
            Senha
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              required
            >
          </label>

          <button type="submit" class="button primary">
            Entrar
            <span>→</span>
          </button>

          <div id="login-error"></div>

        </form>

        <a href="#inicio" class="back-link">
          ← Voltar para o Atlas
        </a>

      </div>
    </main>
  `
}

export function setupLogin() {

  const form = document.querySelector('#login-form')

  form.addEventListener('submit', async (event) => {

    event.preventDefault()

    const email = document.querySelector('#email').value
    const password = document.querySelector('#password').value
    const error = document.querySelector('#login-error')

    error.textContent = ''

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    if (loginError) {
      error.textContent = 'E-mail ou senha incorretos.'
      return
    }

    window.location.hash = '#admin'
  })
}
