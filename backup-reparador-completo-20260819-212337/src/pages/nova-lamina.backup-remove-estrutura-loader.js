import { supabase } from '../lib/supabase.js'

export function renderNovaLamina() {

  const params =
    new URLSearchParams(
      window.location.hash.split('?')[1] || ''
    )

  const editarId =
    params.get('editar')


  return `
    <header class="header">

      <div class="container header-content">

        <a href="#inicio" class="brand">

          <span class="brand-icon">
            🔬
          </span>

          <span>
            <strong>Atlas</strong>
            <small>Histológico</small>
          </span>

        </a>


        <nav class="nav">

          <a href="#inicio">
            Início
          </a>

          <a href="#laminas">
            Lâminas
          </a>

          <a href="#sobre">
            Sobre
          </a>

          <a href="#admin">
            Administração
          </a>

        </nav>

      </div>

    </header>


    <main>

      <section class="form-page">

        <div class="container">

          <a
            href="#admin"
            class="back-link"
          >
            ← Voltar para administração
          </a>


          <div class="form-header">

            <span class="eyebrow">
              ${editarId ? 'EDIÇÃO' : 'CADASTRO'}
            </span>

            <h1>
              ${editarId
                ? 'Editar lâmina'
                : 'Nova lâmina'}
            </h1>

            <p>
              ${
                editarId
                  ? 'Altere as informações desta lâmina.'
                  : 'Cadastre uma nova lâmina no Atlas Histológico.'
              }
            </p>

          </div>


          <div
            id="lamina-form-status"
            class="form-status"
          ></div>


          <form
            id="lamina-form"
            class="lamina-form"
            data-editar-id="${editarId || ''}"
          >

            <div class="form-card">

              <div class="form-card-title">

                <span>
                  📋
                </span>

                <div>

                  <h2>
                    Informações
                  </h2>

                  <p>
                    Dados básicos da lâmina.
                  </p>

                </div>

              </div>


              <div class="form-grid">


                <div class="form-field full">

                  <label for="nome">
                    Nome da lâmina *
                  </label>

                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Ex.: Epitélio intestinal"
                    required
                  >

                </div>


                <div class="form-field full">

                  <label for="descricao">
                    Descrição
                  </label>

                  <textarea
                    id="descricao"
                    name="descricao"
                    rows="5"
                    placeholder="Descreva o que pode ser observado nesta lâmina..."
                  ></textarea>

                </div>


                <div class="form-field">

                  <label for="categoria">
                    Categoria
                  </label>

                  <input
                    id="categoria"
                    name="categoria"
                    type="text"
                    placeholder="Ex.: Tecido epitelial"
                  >

                </div>


                <div class="form-field">

                  <label for="tecnica">
                    Técnica
                  </label>

                  <input
                    id="tecnica"
                    name="tecnica"
                    type="text"
                    placeholder="Ex.: Corte histológico"
                  >

                </div>


                <div class="form-field">

                  <label for="coloracao">
                    Coloração
                  </label>

                  <input
                    id="coloracao"
                    name="coloracao"
                    type="text"
                    placeholder="Ex.: Hematoxilina e eosina"
                  >

                </div>


                <div class="form-field">

                  <label for="publicado">
                    Visibilidade
                  </label>

                  <select
                    id="publicado"
                    name="publicado"
                  >

                    <option value="true">
                      🟢 Publicada
                    </option>

                    <option value="false">
                      ⚪ Oculta
                    </option>

                  </select>

                </div>

              </div>

            </div>


            <div class="form-card">

              <div class="form-card-title">

                <span>
                  🖼️
                </span>

                <div>

                  <h2>
                    Imagem
                  </h2>

                  <p>
                    Imagem utilizada para visualizar a lâmina.
                  </p>

                </div>

              </div>


              <div
                id="current-image"
                class="current-image"
              ></div>


              <div class="upload-area">

                <input
                  id="imagem"
                  name="imagem"
                  type="file"
                  accept="image/*"
                >

                <label for="imagem">

                  <span class="upload-icon">
                    📤
                  </span>

                  <strong>
                    Escolher imagem
                  </strong>

                  <small>
                    PNG, JPG ou WEBP
                  </small>

                </label>

              </div>

            </div>


            <div class="form-card estruturas-editor-card">

              <div class="form-card-title">

                <span>
                  🔬
                </span>

                <div>

                  <h2>
                    Estruturas da lâmina
                  </h2>

                  <p>
                    Cadastre as estruturas que poderão ser identificadas na lâmina.
                  </p>

                </div>

              </div>


              <div
                id="estruturas-lista"
                class="estruturas-lista"
              ></div>


              <div class="estrutura-editor">

                <div class="form-grid">

                  <div class="form-field">

                    <label for="estrutura-nome">
                      Nome da estrutura
                    </label>

                    <input
                      id="estrutura-nome"
                      type="text"
                      placeholder="Ex.: Núcleo"
                    >

                  </div>


                  <div class="form-field">

                    <label for="estrutura-descricao">
                      Descrição
                    </label>

                    <input
                      id="estrutura-descricao"
                      type="text"
                      placeholder="Ex.: Região central da célula"
                    >

                  </div>


                  <div class="form-field">

                    <label for="estrutura-x">
                      Posição X
                    </label>

                    <input
                      id="estrutura-x"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value="0.5"
                    >

                  </div>


                  <div class="form-field">

                    <label for="estrutura-y">
                      Posição Y
                    </label>

                    <input
                      id="estrutura-y"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value="0.5"
                    >

                  </div>


                  <div class="form-field">

                    <label for="estrutura-largura">
                      Largura
                    </label>

                    <input
                      id="estrutura-largura"
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value="0.08"
                    >

                  </div>


                  <div class="form-field">

                    <label for="estrutura-altura">
                      Altura
                    </label>

                    <input
                      id="estrutura-altura"
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value="0.08"
                    >

                  </div>

                </div>


                <button
                  type="button"
                  class="button secondary"
                  id="adicionar-estrutura"
                >
                  + Adicionar estrutura
                </button>

              </div>

            </div>

            <div class="form-actions">

              <a
                href="#admin"
                class="button secondary"
              >
                Cancelar
              </a>

              <button
                type="submit"
                class="button primary"
                id="save-lamina"
              >
                ${
                  editarId
                    ? 'Salvar alterações'
                    : 'Cadastrar lâmina'
                }
              </button>

            </div>

          </form>

        </div>

      </section>

    </main>
  `
}


export async function setupNovaLamina() {

  let estruturas = []


  const form =
    document.querySelector('#lamina-form')

  if (!form) return


  const editarId =
    form.dataset.editarId || null


  /*
   * ============================================================
   * TODAS AS ESTRUTURAS DA LÂMINA
   * ============================================================
   */
  const listaEstruturas =
    document.querySelector('#estruturas-lista')


  function renderizarEstruturas() {

    if (!listaEstruturas) return


    if (!estruturas.length) {

      listaEstruturas.innerHTML = `
        <div class="estrutura-vazia">
          Nenhuma estrutura adicionada ainda.
        </div>
      `

      return
    }


    listaEstruturas.innerHTML =
      estruturas
        .map(
          (estrutura, index) => `

            <div class="estrutura-item">

              <div class="estrutura-item-info">

                <strong>
                  ${escapeHtml(
                    estrutura.nome || 'Estrutura'
                  )}
                </strong>


                ${
                  estrutura.descricao
                    ? `
                      <small>
                        ${escapeHtml(
                          estrutura.descricao
                        )}
                      </small>
                    `
                    : ''
                }


                <small>
                  X: ${estrutura.x}
                  • Y: ${estrutura.y}
                  • L: ${estrutura.largura}
                  • A: ${estrutura.altura}
                </small>

              </div>


              <button
                type="button"
                class="button secondary"
                data-remover-estrutura="${index}"
              >
                Remover
              </button>

            </div>
          `
        )
        .join('')


    listaEstruturas
      .querySelectorAll(
        '[data-remover-estrutura]'
      )
      .forEach(
        botao => {

          botao.addEventListener(
            'click',
            () => {

              const index =
                Number(
                  botao.dataset
                    .removerEstrutura
                )


              if (
                Number.isNaN(index)
              ) {
                return
              }


              estruturas.splice(
                index,
                1
              )


              renderizarEstruturas()

            }
          )

        }
      )

  }


  /*
   * ============================================================
   * BOTÃO ADICIONAR ESTRUTURA
   * ============================================================
   */

  const adicionarEstrutura =
    document.querySelector(
      '#adicionar-estrutura'
    )


  adicionarEstrutura?.addEventListener(
    'click',
    () => {

      const nomeInput =
        document.querySelector(
          '#estrutura-nome'
        )


      const descricaoInput =
        document.querySelector(
          '#estrutura-descricao'
        )


      const xInput =
        document.querySelector(
          '#estrutura-x'
        )


      const yInput =
        document.querySelector(
          '#estrutura-y'
        )


      const larguraInput =
        document.querySelector(
          '#estrutura-largura'
        )


      const alturaInput =
        document.querySelector(
          '#estrutura-altura'
        )


      const nome =
        nomeInput?.value.trim() || ''


      const descricao =
        descricaoInput?.value.trim() || ''


      const x =
        Number(
          xInput?.value || 0.5
        )


      const y =
        Number(
          yInput?.value || 0.5
        )


      const largura =
        Number(
          larguraInput?.value || 0.08
        )


      const altura =
        Number(
          alturaInput?.value || 0.08
        )


      if (!nome) {

        mostrarStatus(
          'Digite o nome da estrutura.',
          'error'
        )

        nomeInput?.focus()

        return
      }


      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(largura) ||
        !Number.isFinite(altura)
      ) {

        mostrarStatus(
          'Verifique as posições e dimensões da estrutura.',
          'error'
        )

        return
      }


      estruturas.push({

        nome,

        descricao,

        x: Math.max(
          0,
          Math.min(1, x)
        ),

        y: Math.max(
          0,
          Math.min(1, y)
        ),

        largura: Math.max(
          0.01,
          Math.min(1, largura)
        ),

        altura: Math.max(
          0.01,
          Math.min(1, altura)
        )

      })


      renderizarEstruturas()


      /*
       * Limpa os campos de texto.
       */

      if (nomeInput) {
        nomeInput.value = ''
      }


      if (descricaoInput) {
        descricaoInput.value = ''
      }


      if (xInput) {
        xInput.value = '0.5'
      }


      if (yInput) {
        yInput.value = '0.5'
      }


      if (larguraInput) {
        larguraInput.value = '0.08'
      }


      if (alturaInput) {
        alturaInput.value = '0.08'
      }


      nomeInput?.focus()


      mostrarStatus(
        'Estrutura adicionada.',
        'success'
      )

    }
  )


  /*
   * ============================================================
   * CARREGA LÂMINA QUANDO ESTÁ EDITANDO
   * ============================================================
   */

  if (editarId) {

    const carregada =
      await carregarLamina(
        editarId
      )


    if (
      carregada &&
      Array.isArray(
        carregada.estruturas
      )
    ) {

      estruturas =
        carregada.estruturas

      renderizarEstruturas()

    }

  }


  /*
   * ============================================================
   * SALVAR
   * ============================================================
   */

  form.addEventListener(
    'submit',
    async event => {

      event.preventDefault()


      await salvarLamina(
        form,
        editarId,
        estruturas
      )

    }
  )


  renderizarEstruturas()

}

async function carregarLamina(id) {

  mostrarStatus(
    'Carregando informações da lâmina...',
    'loading'
  )


  const {
    data,
    error
  } =
    await supabase
      .from('laminas')
      .select('*')
      .eq('id', id)
      .single()


  if (error || !data) {

    console.error(
      'Erro ao carregar lâmina:',
      error
    )


    mostrarStatus(
      'Não foi possível carregar esta lâmina.',
      'error'
    )

    return
  }


  document.querySelector('#nome').value =
    data.nome || ''


  document.querySelector('#descricao').value =
    data.descricao || ''


  document.querySelector('#categoria').value =
    data.categoria || ''


  document.querySelector('#tecnica').value =
    data.tecnica || ''


  document.querySelector('#coloracao').value =
    data.coloracao || ''


  document.querySelector('#publicado').value =
    data.publicado === false
      ? 'false'
      : 'true'


  estruturas = Array.isArray(data.estruturas)
    ? data.estruturas
    : []

  renderizarEstruturas?.()


  if (data.imagem_url) {

    document.querySelector(
      '#current-image'
    ).innerHTML = `

      <div class="current-image-preview">

        <span>
          Imagem atual
        </span>

        <img
          src="${escapeHtml(data.imagem_url)}"
          alt="Imagem atual da lâmina"
        >

      </div>

    `
  }


  mostrarStatus(
    '',
    ''
  )

  return data

}


async function salvarLamina(
  form,
  editarId,
  estruturas = []
) {

  const button =
    document.querySelector('#save-lamina')


  button.disabled = true


  button.textContent =
    editarId
      ? 'Salvando alterações...'
      : 'Cadastrando...'


  mostrarStatus(
    'Salvando informações...',
    'loading'
  )


  try {

    const formData =
      new FormData(form)


    const nome =
      String(
        formData.get('nome') || ''
      ).trim()


    if (!nome) {

      throw new Error(
        'Digite o nome da lâmina.'
      )

    }


    const descricao =
      String(
        formData.get('descricao') || ''
      ).trim()


    const categoria =
      String(
        formData.get('categoria') || ''
      ).trim()


    const tecnica =
      String(
        formData.get('tecnica') || ''
      ).trim()


    const coloracao =
      String(
        formData.get('coloracao') || ''
      ).trim()


    const publicado =
      formData.get('publicado') === 'true'


    const arquivo =
      formData.get('imagem')


    let imagemUrl =
      null


    /*
     * Se estiver editando e não escolher
     * uma nova imagem, mantém a imagem atual.
     */

    if (editarId) {

      const {
        data: atual
      } =
        await supabase
          .from('laminas')
          .select('imagem_url')
          .eq('id', editarId)
          .single()


      imagemUrl =
        atual?.imagem_url || null

    }


    /*
     * Upload de uma nova imagem
     */

    if (
      arquivo &&
      arquivo instanceof File &&
      arquivo.size > 0
    ) {

      const extensao =
        arquivo.name
          .split('.')
          .pop()
          .toLowerCase()


      const nomeArquivo =
        `${crypto.randomUUID()}.${extensao}`


      const caminho =
        `laminas/${nomeArquivo}`


      const {
        error: uploadError
      } =
        await supabase
          .storage
          .from('laminas')
          .upload(
            caminho,
            arquivo,
            {
              cacheControl: '3600',
              upsert: false
            }
          )


      if (uploadError) {

        console.error(
          'Erro no upload:',
          uploadError
        )

        throw new Error(
          `Erro ao enviar a imagem: ${uploadError.message}`
        )

      }


      const {
        data: publicUrl
      } =
        supabase
          .storage
          .from('laminas')
          .getPublicUrl(caminho)


      imagemUrl =
        publicUrl.publicUrl

    }


    const dados = {

      nome,

      descricao,

      categoria,

      tecnica,

      coloracao,

      publicado,

      estruturas,

      updated_at:
        new Date().toISOString()

    }


    if (imagemUrl) {

      dados.imagem_url =
        imagemUrl

    }


    let resultado


    if (editarId) {

      resultado =
        await supabase
          .from('laminas')
          .update(dados)
          .eq('id', editarId)

    } else {

      resultado =
        await supabase
          .from('laminas')
          .insert(dados)

    }


    if (resultado.error) {

      console.error(
        'Erro ao salvar:',
        resultado.error
      )

      throw new Error(
        `Erro ao salvar a lâmina: ${resultado.error.message}`
      )

    }


    mostrarStatus(
      editarId
        ? 'Lâmina atualizada com sucesso!'
        : 'Lâmina cadastrada com sucesso!',
      'success'
    )


    setTimeout(
      () => {

        window.location.hash =
          '#admin'

      },
      1000
    )

  } catch (error) {

    console.error(error)


    mostrarStatus(
      error.message ||
      'Ocorreu um erro ao salvar.',
      'error'
    )


    button.disabled = false


    button.textContent =
      editarId
        ? 'Salvar alterações'
        : 'Cadastrar lâmina'

  }

}


function mostrarStatus(
  mensagem,
  tipo
) {

  const elemento =
    document.querySelector(
      '#lamina-form-status'
    )


  if (!elemento) return


  elemento.textContent =
    mensagem


  elemento.className =
    `form-status ${tipo || ''}`

}


function escapeHtml(value = '') {

  return String(value)

    .replaceAll('&', '&amp;')

    .replaceAll('<', '&lt;')

    .replaceAll('>', '&gt;')

    .replaceAll('"', '&quot;')

    .replaceAll("'", '&#039;')
}






