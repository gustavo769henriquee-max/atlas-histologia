$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================================"
Write-Host " ATUALIZADOR SEGURO - EDITOR DE ESTRUTURAS DO ATLAS"
Write-Host "============================================================"
Write-Host ""

$root = Get-Location

$novaLamina = Join-Path $root "src\pages\nova-lamina.js"
$mainJs = Join-Path $root "src\main.js"
$cssCandidates = @(
    (Join-Path $root "src\style.css"),
    (Join-Path $root "src\styles.css"),
    (Join-Path $root "src\main.css")
)

if (!(Test-Path $novaLamina)) {
    throw "Arquivo não encontrado: $novaLamina"
}

if (!(Test-Path $mainJs)) {
    throw "Arquivo não encontrado: $mainJs"
}

$cssFile = $cssCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (!$cssFile) {
    Write-Host "Aviso: nenhum CSS principal encontrado."
    Write-Host "O editor funcionará, mas o estilo poderá precisar ser adicionado manualmente."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

$backupDir = Join-Path $root "backup-editor-$timestamp"

New-Item -ItemType Directory -Path $backupDir | Out-Null

Write-Host ""
Write-Host "Backup:"
Write-Host $backupDir
Write-Host ""

Copy-Item $novaLamina (Join-Path $backupDir "nova-lamina.js")
Copy-Item $mainJs (Join-Path $backupDir "main.js")

if ($cssFile) {
    Copy-Item $cssFile (Join-Path $backupDir ([IO.Path]::GetFileName($cssFile)))
}

function Restore-Backup {

    Write-Host ""
    Write-Host "============================================================"
    Write-Host " FALHA DETECTADA - RESTAURANDO BACKUP"
    Write-Host "============================================================"

    Copy-Item `
        (Join-Path $backupDir "nova-lamina.js") `
        $novaLamina `
        -Force

    Copy-Item `
        (Join-Path $backupDir "main.js") `
        $mainJs `
        -Force

    if ($cssFile) {

        Copy-Item `
            (Join-Path $backupDir ([IO.Path]::GetFileName($cssFile))) `
            $cssFile `
            -Force

    }

    Write-Host ""
    Write-Host "Arquivos originais restaurados."
    Write-Host "Nenhuma alteração incompleta foi mantida."
    Write-Host ""
}

function Read-Utf8($path) {
    return [IO.File]::ReadAllText(
        $path,
        [Text.UTF8Encoding]::new($false)
    )
}

function Write-Utf8($path, $content) {

    [IO.File]::WriteAllText(
        $path,
        $content,
        [Text.UTF8Encoding]::new($false)
    )

}

function Replace-Required {
    param(
        [string]$Text,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Name
    )

    $regex = [regex]::new(
        $Pattern,
        [Text.RegularExpressions.RegexOptions]::Singleline
    )

    if (!$regex.IsMatch($Text)) {
        throw "Não foi possível localizar o trecho esperado: $Name"
    }

    return $regex.Replace(
        $Text,
        [Text.RegularExpressions.MatchEvaluator]{
            param($m)
            $Replacement
        },
        1
    )
}

try {

    Write-Host "Lendo arquivos..."

    $nova = Read-Utf8 $novaLamina
    $main = Read-Utf8 $mainJs

    Write-Host "Arquivos lidos."

    # =========================================================
    # NOVO HTML DO EDITOR
    # =========================================================

    $novoEditorHtml = @'
              <div class="estrutura-editor">

                <div class="estrutura-editor-toolbar">

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

                </div>


                <div class="form-field">

                  <label>
                    Tipo de marcação
                  </label>

                  <div
                    id="estrutura-ferramentas"
                    class="estrutura-ferramentas"
                  >

                    <button
                      type="button"
                      class="estrutura-tool active"
                      data-estrutura-tool="ponto"
                    >
                      📍 Ponto
                    </button>

                    <button
                      type="button"
                      class="estrutura-tool"
                      data-estrutura-tool="retangulo"
                    >
                      ▭ Retângulo
                    </button>

                    <button
                      type="button"
                      class="estrutura-tool"
                      data-estrutura-tool="seta"
                    >
                      ➜ Seta
                    </button>

                    <button
                      type="button"
                      class="estrutura-tool"
                      data-estrutura-tool="texto"
                    >
                      T Texto
                    </button>

                  </div>

                </div>


                <div
                  id="estrutura-imagem-editor"
                  class="estrutura-imagem-editor"
                >

                  <div class="estrutura-imagem-placeholder">

                    Escolha uma imagem da lâmina para começar
                    a apontar as estruturas.

                  </div>

                </div>


                <div
                  id="estrutura-texto-editor"
                  class="estrutura-texto-editor"
                  hidden
                >

                  <div class="form-field">

                    <label for="estrutura-texto">
                      Texto da marcação
                    </label>

                    <input
                      id="estrutura-texto"
                      type="text"
                      placeholder="Ex.: Lúmen"
                    >

                  </div>

                </div>


                <div
                  id="estrutura-editor-ajuda"
                  class="estrutura-editor-ajuda"
                >
                  Selecione uma ferramenta e clique ou arraste
                  sobre a imagem.
                </div>


                <button
                  type="button"
                  class="button secondary"
                  id="adicionar-estrutura"
                >
                  + Adicionar estrutura
                </button>


                <div
                  id="estruturas-lista"
                  class="estruturas-lista"
                ></div>

              </div>

'@

    # Substitui somente a área estrutura-editor dentro do card.
    $nova = Replace-Required `
        $nova `
        '<div class="estrutura-editor">.*?(?=\s*</div>\s*</div>\s*<div class="form-actions">)' `
        $novoEditorHtml `
        "editor visual de estruturas"

    # =========================================================
    # NOVO SETUP DO EDITOR
    # =========================================================

    $novoSetup = @'
export async function setupNovaLamina() {

  await carregarCategoriasLamina()


  let estruturas = []


  const form =
    document.querySelector('#lamina-form')

  if (!form) return


  const editarId =
    form.dataset.editarId || null


  const listaEstruturas =
    document.querySelector('#estruturas-lista')


  const imagemInput =
    document.querySelector('#imagem')


  const imagemEditor =
    document.querySelector('#estrutura-imagem-editor')


  const ferramentas =
    document.querySelectorAll(
      '[data-estrutura-tool]'
    )


  const textoEditor =
    document.querySelector(
      '#estrutura-texto-editor'
    )


  const textoInput =
    document.querySelector(
      '#estrutura-texto'
    )


  const nomeInput =
    document.querySelector(
      '#estrutura-nome'
    )


  const descricaoInput =
    document.querySelector(
      '#estrutura-descricao'
    )


  const ajuda =
    document.querySelector(
      '#estrutura-editor-ajuda'
    )


  let ferramentaAtual =
    'ponto'


  let imagemEditorImg =
    null


  let imagemEditorOverlay =
    null


  let arrastando =
    false


  let inicio =
    null


  let previewElemento =
    null


  function limitar(valor) {

    return Math.max(
      0,
      Math.min(
        1,
        Number(valor) || 0
      )
    )

  }


  function obterCoordenadas(event) {

    if (!imagemEditorImg) {
      return null
    }


    const rect =
      imagemEditorImg.getBoundingClientRect()


    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {

      return null

    }


    return {

      x:
        limitar(
          (event.clientX - rect.left) /
          rect.width
        ),

      y:
        limitar(
          (event.clientY - rect.top) /
          rect.height
        )

    }

  }


  function limparPreview() {

    if (previewElemento) {

      previewElemento.remove()

      previewElemento =
        null

    }

  }


  function criarPreview(tipo, inicio, fim) {

    limparPreview()


    if (!imagemEditorOverlay) {
      return
    }


    const elemento =
      document.createElement('div')


    elemento.className =
      `estrutura-preview estrutura-preview-${tipo}`


    if (tipo === 'ponto') {

      elemento.style.left =
        `${inicio.x * 100}%`

      elemento.style.top =
        `${inicio.y * 100}%`

      elemento.style.width =
        '18px'

      elemento.style.height =
        '18px'

      elemento.style.transform =
        'translate(-50%, -50%)'

    }


    if (tipo === 'retangulo') {

      const x =
        Math.min(
          inicio.x,
          fim.x
        )

      const y =
        Math.min(
          inicio.y,
          fim.y
        )

      const largura =
        Math.abs(
          fim.x - inicio.x
        )

      const altura =
        Math.abs(
          fim.y - inicio.y
        )


      elemento.style.left =
        `${x * 100}%`

      elemento.style.top =
        `${y * 100}%`

      elemento.style.width =
        `${largura * 100}%`

      elemento.style.height =
        `${altura * 100}%`

    }


    if (tipo === 'seta') {

      const dx =
        fim.x - inicio.x

      const dy =
        fim.y - inicio.y

      const comprimento =
        Math.sqrt(
          dx * dx +
          dy * dy
        )


      const angulo =
        Math.atan2(
          dy,
          dx
        ) *
        180 /
        Math.PI


      elemento.style.left =
        `${inicio.x * 100}%`

      elemento.style.top =
        `${inicio.y * 100}%`

      elemento.style.width =
        `${comprimento * 100}%`

      elemento.style.transform =
        `rotate(${angulo}deg)`

    }


    if (tipo === 'texto') {

      elemento.style.left =
        `${inicio.x * 100}%`

      elemento.style.top =
        `${inicio.y * 100}%`

      elemento.textContent =
        textoInput?.value.trim() ||
        'Texto'

    }


    imagemEditorOverlay.appendChild(
      elemento
    )


    previewElemento =
      elemento

  }


  function renderizarImagemEditor() {

    if (!imagemEditor) {
      return
    }


    imagemEditor.innerHTML = ''


    if (!imagemEditorImg) {

      imagemEditor.innerHTML = `

        <div class="estrutura-imagem-placeholder">

          Escolha uma imagem da lâmina para começar
          a apontar as estruturas.

        </div>

      `

      imagemEditorOverlay =
        null

      return

    }


    const wrapper =
      document.createElement('div')


    wrapper.className =
      'estrutura-imagem-wrapper'


    const img =
      imagemEditorImg.cloneNode(true)


    img.className =
      'estrutura-imagem'


    wrapper.appendChild(img)


    const overlay =
      document.createElement('div')


    overlay.className =
      'estrutura-imagem-overlay'


    wrapper.appendChild(
      overlay
    )


    imagemEditor.appendChild(
      wrapper
    )


    imagemEditorImg =
      img

    imagemEditorOverlay =
      overlay


    estruturas.forEach(
      (estrutura, index) => {

        desenharEstruturaEditor(
          estrutura,
          index
        )

      }
    )

  }


  function desenharEstruturaEditor(
    estrutura,
    index
  ) {

    if (
      !imagemEditorOverlay ||
      !estrutura
    ) {

      return

    }


    const elemento =
      document.createElement('div')


    const tipo =
      estrutura.tipo ||
      'ponto'


    elemento.className =
      `estrutura-editor-marcacao estrutura-editor-${tipo}`


    elemento.dataset.index =
      String(index)


    elemento.title =
      estrutura.nome ||
      'Estrutura'


    if (tipo === 'ponto') {

      elemento.style.left =
        `${estrutura.x * 100}%`

      elemento.style.top =
        `${estrutura.y * 100}%`

      elemento.style.width =
        '18px'

      elemento.style.height =
        '18px'

      elemento.style.transform =
        'translate(-50%, -50%)'

    }


    if (tipo === 'retangulo') {

      elemento.style.left =
        `${estrutura.x * 100}%`

      elemento.style.top =
        `${estrutura.y * 100}%`

      elemento.style.width =
        `${estrutura.largura * 100}%`

      elemento.style.height =
        `${estrutura.altura * 100}%`

    }


    if (tipo === 'seta') {

      const x2 =
        Number(
          estrutura.x2 ??
          estrutura.x +
          estrutura.largura
        )

      const y2 =
        Number(
          estrutura.y2 ??
          estrutura.y +
          estrutura.altura
        )


      const dx =
        x2 - estrutura.x

      const dy =
        y2 - estrutura.y

      const comprimento =
        Math.sqrt(
          dx * dx +
          dy * dy
        )


      const angulo =
        Math.atan2(
          dy,
          dx
        ) *
        180 /
        Math.PI


      elemento.style.left =
        `${estrutura.x * 100}%`

      elemento.style.top =
        `${estrutura.y * 100}%`

      elemento.style.width =
        `${comprimento * 100}%`

      elemento.style.transform =
        `rotate(${angulo}deg)`

    }


    if (tipo === 'texto') {

      elemento.style.left =
        `${estrutura.x * 100}%`

      elemento.style.top =
        `${estrutura.y * 100}%`

      elemento.textContent =
        estrutura.texto ||
        estrutura.nome ||
        'Texto'

    }


    elemento.addEventListener(
      'click',
      event => {

        event.stopPropagation()


        const confirmou =
          window.confirm(
            `Remover "${estrutura.nome || 'estrutura'}"?`
          )


        if (!confirmou) {
          return
        }


        estruturas.splice(
          index,
          1
        )


        renderizarLista()

        renderizarImagemEditor()

      }
    )


    imagemEditorOverlay.appendChild(
      elemento
    )

  }


  function renderizarLista() {

    if (!listaEstruturas) {
      return
    }


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
                    estrutura.nome ||
                    estrutura.texto ||
                    'Estrutura'
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
                  Tipo:
                  ${escapeHtml(
                    estrutura.tipo ||
                    'ponto'
                  )}
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


              renderizarLista()

              renderizarImagemEditor()

            }
          )

        }
      )

  }


  function limparCampos() {

    if (nomeInput) {
      nomeInput.value = ''
    }


    if (descricaoInput) {
      descricaoInput.value = ''
    }


    if (textoInput) {
      textoInput.value = ''
    }


    if (textoEditor) {
      textoEditor.hidden = true
    }

  }


  ferramentas.forEach(
    botao => {

      botao.addEventListener(
        'click',
        () => {

          ferramentas.forEach(
            item => {
              item.classList.remove(
                'active'
              )
            }
          )


          botao.classList.add(
            'active'
          )


          ferramentaAtual =
            botao.dataset
              .estruturaTool ||
            'ponto'


          if (textoEditor) {

            textoEditor.hidden =
              ferramentaAtual !==
              'texto'

          }


          if (ajuda) {

            const mensagens = {

              ponto:
                'Clique uma vez na imagem para marcar.',

              retangulo:
                'Clique e arraste para desenhar o retângulo.',

              seta:
                'Clique e arraste para desenhar a seta.',

              texto:
                'Digite o texto e clique na imagem.'

            }


            ajuda.textContent =
              mensagens[
                ferramentaAtual
              ] ||
              'Clique ou arraste sobre a imagem.'

          }

        }
      )

    }
  )


  function adicionarEstruturaNaImagem(
    inicio,
    fim
  ) {

    const nome =
      nomeInput?.value.trim() ||
      ''


    const descricao =
      descricaoInput?.value.trim() ||
      ''


    if (!nome) {

      mostrarStatus(
        'Digite o nome da estrutura antes de marcar.',
        'error'
      )

      nomeInput?.focus()

      return

    }


    const tipo =
      ferramentaAtual


    const estrutura = {

      nome,

      descricao,

      tipo,

      x:
        inicio.x,

      y:
        inicio.y,

      largura:
        tipo === 'retangulo'
          ? Math.max(
              0.005,
              Math.abs(
                fim.x -
                inicio.x
              )
            )
          : 0.02,

      altura:
        tipo === 'retangulo'
          ? Math.max(
              0.005,
              Math.abs(
                fim.y -
                inicio.y
              )
            )
          : 0.02

    }


    if (
      tipo === 'retangulo'
    ) {

      estrutura.x =
        Math.min(
          inicio.x,
          fim.x
        )

      estrutura.y =
        Math.min(
          inicio.y,
          fim.y
        )

    }


    if (
      tipo === 'seta'
    ) {

      estrutura.x2 =
        fim.x

      estrutura.y2 =
        fim.y

    }


    if (
      tipo === 'texto'
    ) {

      const texto =
        textoInput?.value.trim() ||
        nome


      estrutura.texto =
        texto

    }


    estruturas.push(
      estrutura
    )


    renderizarLista()

    renderizarImagemEditor()

    limparCampos()


    mostrarStatus(
      'Estrutura adicionada.',
      'success'
    )

  }


  if (imagemEditor) {

    imagemEditor.addEventListener(
      'pointerdown',
      event => {

        if (
          !imagemEditorImg ||
          event.target.closest(
            '.estrutura-editor-marcacao'
          )
        ) {

          return

        }


        const ponto =
          obterCoordenadas(
            event
          )


        if (!ponto) {
          return
        }


        if (
          ferramentaAtual ===
          'texto'
        ) {

          const texto =
            window.prompt(
              'Digite o texto da marcação:'
            )


          if (
            texto === null ||
            !texto.trim()
          ) {

            return

          }


          if (textoInput) {

            textoInput.value =
              texto.trim()

          }


          adicionarEstruturaNaImagem(
            ponto,
            ponto
          )


          return

        }


        inicio =
          ponto

        arrastando =
          true


        imagemEditor.setPointerCapture?.(
          event.pointerId
        )


        if (
          ferramentaAtual ===
          'ponto'
        ) {

          adicionarEstruturaNaImagem(
            ponto,
            ponto
          )

          arrastando =
            false

          return

        }


        criarPreview(
          ferramentaAtual,
          ponto,
          ponto
        )

      }
    )


    imagemEditor.addEventListener(
      'pointermove',
      event => {

        if (
          !arrastando ||
          !inicio
        ) {

          return

        }


        const fim =
          obterCoordenadas(
            event
          )


        if (!fim) {
          return
        }


        criarPreview(
          ferramentaAtual,
          inicio,
          fim
        )

      }
    )


    imagemEditor.addEventListener(
      'pointerup',
      event => {

        if (
          !arrastando ||
          !inicio
        ) {

          return

        }


        const fim =
          obterCoordenadas(
            event
          )


        arrastando =
          false


        imagemEditor.releasePointerCapture?.(
          event.pointerId
        )


        limparPreview()


        if (!fim) {

          inicio =
            null

          return

        }


        const distancia =
          Math.sqrt(
            Math.pow(
              fim.x -
              inicio.x,
              2
            ) +
            Math.pow(
              fim.y -
              inicio.y,
              2
            )
          )


        if (
          distancia <
          0.005
        ) {

          inicio =
            null

          mostrarStatus(
            'Arraste um pouco mais para criar a marcação.',
            'error'
          )

          return

        }


        adicionarEstruturaNaImagem(
          inicio,
          fim
        )


        inicio =
          null

      }
    )

  }


  if (imagemInput) {

    imagemInput.addEventListener(
      'change',
      () => {

        const arquivo =
          imagemInput.files?.[0]


        if (!arquivo) {
          return
        }


        if (
          !arquivo.type.startsWith(
            'image/'
          )
        ) {

          mostrarStatus(
            'Selecione uma imagem válida.',
            'error'
          )

          return

        }


        const reader =
          new FileReader()


        reader.onload =
          () => {

            imagemEditorImg =
              document.createElement(
                'img'
              )

            imagemEditorImg.src =
              reader.result

            imagemEditorImg.alt =
              'Imagem da lâmina'


            imagemEditorImg.onload =
              () => {

                renderizarImagemEditor()

              }

          }


        reader.readAsDataURL(
          arquivo
        )

      }
    )

  }


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
        carregada.estruturas.map(
          normalizarEstrutura
        )

    }


    if (
      carregada?.imagem_url &&
      imagemEditor
    ) {

      imagemEditorImg =
        document.createElement(
          'img'
        )

      imagemEditorImg.src =
        carregada.imagem_url

      imagemEditorImg.alt =
        'Imagem da lâmina'


      imagemEditorImg.onload =
        () => {

          renderizarImagemEditor()

        }

    }

  }


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


  renderizarLista()

}
'

    $nova = Replace-Required `
        $nova `
        'export async function setupNovaLamina\(\) \{.*?(?=\r?\nfunction normalizarEstrutura\()' `
        ($novoSetup + "`r`n") `
        "função setupNovaLamina"

    # =========================================================
    # NORMALIZAÇÃO COMPATÍVEL
    # =========================================================

    $novaNormalizacao = @'
function normalizarEstrutura(
  estrutura = {}
) {

  const tipoValido = [
    'ponto',
    'retangulo',
    'seta',
    'texto'
  ]


  const tipo =
    tipoValido.includes(
      estrutura.tipo
    )
      ? estrutura.tipo
      : 'ponto'


  const x =
    Number(
      estrutura.x ??
      0.5
    )


  const y =
    Number(
      estrutura.y ??
      0.5
    )


  const largura =
    Number(
      estrutura.largura ??
      0.08
    )


  const altura =
    Number(
      estrutura.altura ??
      0.08
    )


  return {

    nome:
      String(
        estrutura.nome ||
        ''
      ).trim(),

    descricao:
      String(
        estrutura.descricao ||
        ''
      ).trim(),

    tipo,

    x:
      Math.max(
        0,
        Math.min(
          1,
          Number.isFinite(x)
            ? x
            : 0.5
        )
      ),

    y:
      Math.max(
        0,
        Math.min(
          1,
          Number.isFinite(y)
            ? y
            : 0.5
        )
      ),

    largura:
      Math.max(
        0.001,
        Math.min(
          1,
          Number.isFinite(largura)
            ? largura
            : 0.08
        )
      ),

    altura:
      Math.max(
        0.001,
        Math.min(
          1,
          Number.isFinite(altura)
            ? altura
            : 0.08
        )
      ),

    x2:
      Number.isFinite(
        Number(estrutura.x2)
      )
        ? Math.max(
            0,
            Math.min(
              1,
              Number(estrutura.x2)
            )
          )
        : undefined,

    y2:
      Number.isFinite(
        Number(estrutura.y2)
      )
        ? Math.max(
            0,
            Math.min(
              1,
              Number(estrutura.y2)
            )
          )
        : undefined,

    texto:
      String(
        estrutura.texto ||
        ''
      ).trim()

  }

}

'@

    $nova = Replace-Required `
        $nova `
        'function normalizarEstrutura\(\s*estrutura = \{\}\s*\) \{.*?(?=\r?\nasync function carregarLamina\()' `
        $novaNormalizacao `
        "normalização das estruturas"

    Write-Utf8 $novaLamina $nova

    Write-Host "nova-lamina.js atualizado."

    # =========================================================
    # NOVO RENDERIZADOR NO VIEWER
    # =========================================================

    $inicioFuncao = $main.IndexOf(
        "function desenharEstruturas("
    )

    if ($inicioFuncao -lt 0) {
        throw "A função desenharEstruturas() não foi encontrada em main.js"
    }

    $inicioFuncaoSeguinte = $main.IndexOf(
        "function ",
        $inicioFuncao + 10
    )

    if ($inicioFuncaoSeguinte -lt 0) {
        throw "Não foi possível determinar o fim de desenharEstruturas()."
    }

    $novaDesenhar = @'
function desenharEstruturas(
  viewer,
  lamina
) {

  if (!viewer || !lamina) {
    return
  }


  const estruturas =
    Array.isArray(
      lamina.estruturas
    )
      ? lamina.estruturas
      : []


  const tiledImage =
    viewer.world.getItemAt(0)


  if (!tiledImage) {
    return
  }


  const imageSize =
    tiledImage.getContentSize()


  const imageWidth =
    Number(imageSize.x)


  const imageHeight =
    Number(imageSize.y)


  if (
    !Number.isFinite(imageWidth) ||
    !Number.isFinite(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return
  }


  viewer
    .currentOverlays
    .slice()
    .forEach(
      overlay => {

        const elemento =
          overlay?.element


        if (
          elemento?.classList?.contains(
            'estrutura-overlay'
          )
        ) {

          try {
            viewer.removeOverlay(
              elemento
            )
          } catch {
            // Overlay já removido.
          }

        }

      }
    )


  estruturas.forEach(
    (estrutura, index) => {

      const tipo =
        estrutura.tipo ||
        'ponto'


      const nome =
        String(
          estrutura.nome ||
          `Estrutura ${index + 1}`
        )


      const descricao =
        String(
          estrutura.descricao ||
          ''
        )


      const x =
        Math.max(
          0,
          Math.min(
            1,
            Number(
              estrutura.x ??
              0.5
            )
          )
        )


      const y =
        Math.max(
          0,
          Math.min(
            1,
            Number(
              estrutura.y ??
              0.5
            )
          )
        )


      const largura =
        Math.max(
          0.001,
          Math.min(
            1,
            Number(
              estrutura.largura ??
              0.08
            )
          )
        )


      const altura =
        Math.max(
          0.001,
          Math.min(
            1,
            Number(
              estrutura.altura ??
              0.08
            )
          )
        )


      const elemento =
        document.createElement(
          'div'
        )


      elemento.className =
        `estrutura-overlay estrutura-overlay-${tipo}`


      elemento.dataset.estruturaIndex =
        String(index)


      elemento.title =
        descricao
          ? `${nome}: ${descricao}`
          : nome


      elemento.style.cursor =
        'pointer'


      let rect


      if (
        tipo === 'seta'
      ) {

        const x2 =
          Math.max(
            0,
            Math.min(
              1,
              Number(
                estrutura.x2 ??
                x + largura
              )
            )
          )


        const y2 =
          Math.max(
            0,
            Math.min(
              1,
              Number(
                estrutura.y2 ??
                y + altura
              )
            )
          )


        const inicioX =
          x * imageWidth


        const inicioY =
          y * imageHeight


        const fimX =
          x2 * imageWidth


        const fimY =
          y2 * imageHeight


        const dx =
          fimX -
          inicioX


        const dy =
          fimY -
          inicioY


        const comprimento =
          Math.sqrt(
            dx * dx +
            dy * dy
          )


        const angulo =
          Math.atan2(
            dy,
            dx
          ) *
          180 /
          Math.PI


        const ponto =
          viewer.viewport
            .imageToViewportCoordinates(
              inicioX,
              inicioY
            )


        const tamanho =
          viewer.viewport
            .imageToViewportCoordinates(
              comprimento,
              0
            )


        elemento.style.width =
          `${Math.max(
            20,
            Math.abs(
              tamanho.x
            )
          )}px`


        elemento.style.height =
          '4px'


        elemento.style.transform =
          `rotate(${angulo}deg)`


        elemento.style.transformOrigin =
          '0 50%'


        viewer.addOverlay({

          element:
            elemento,

          location:
            ponto,

          placement:
            OpenSeadragon.Placement.TOP_LEFT

        })


        elemento.addEventListener(
          'click',
          event => {

            event.preventDefault()

            event.stopPropagation()


            mostrarTextoEstrutura(
              index,
              lamina
            )

          }
        )


        return

      }


      if (
        tipo === 'texto'
      ) {

        const imageX =
          x *
          imageWidth


        const imageY =
          y *
          imageHeight


        const ponto =
          viewer.viewport
            .imageToViewportCoordinates(
              imageX,
              imageY
            )


        elemento.innerHTML = `
          <span class="estrutura-texto-label">
            ${escapeHtml(
              estrutura.texto ||
              nome
            )}
          </span>
        `


        viewer.addOverlay({

          element:
            elemento,

          location:
            ponto,

          placement:
            OpenSeadragon.Placement.TOP_LEFT

        })


        elemento.addEventListener(
          'click',
          event => {

            event.preventDefault()

            event.stopPropagation()


            mostrarTextoEstrutura(
              index,
              lamina
            )

          }
        )


        return

      }


      const imageX =
        x *
        imageWidth


      const imageY =
        y *
        imageHeight


      const imageWidthEstrutura =
        largura *
        imageWidth


      const imageHeightEstrutura =
        altura *
        imageHeight


      rect =
        viewer.viewport
          .imageToViewportRectangle(
            imageX,
            imageY,
            imageWidthEstrutura,
            imageHeightEstrutura
          )


      if (!rect) {
        return
      }


      if (
        tipo === 'ponto'
      ) {

        elemento.innerHTML = `
          <div class="estrutura-box estrutura-box-ponto">
            <span class="estrutura-ponto"></span>
            <span class="estrutura-label">
              ${escapeHtml(nome)}
            </span>
          </div>
        `

      } else {

        elemento.innerHTML = `
          <div class="estrutura-box estrutura-box-retangulo">
            <span class="estrutura-label">
              ${escapeHtml(nome)}
            </span>
          </div>
        `

      }


      viewer.addOverlay({

        element:
          elemento,

        location:
          rect,

        placement:
          OpenSeadragon.Placement.TOP_LEFT

      })


      elemento.addEventListener(
        'click',
        event => {

          event.preventDefault()

          event.stopPropagation()


          mostrarTextoEstrutura(
            index,
            lamina
          )


          if (
            typeof centralizarEstrutura ===
            'function'
          ) {

            centralizarEstrutura(
              viewer,
              elemento,
              true
            )

          }

        }
      )

    }
  )

}

'@

    $antes = $main.Substring(
        0,
        $inicioFuncao
    )

    $depois = $main.Substring(
        $inicioFuncaoSeguinte
    )

    $main =
        $antes +
        $novaDesenhar +
        "`r`n`r`n" +
        $depois

    Write-Utf8 $mainJs $main

    Write-Host "main.js atualizado."

    # =========================================================
    # CSS
    # =========================================================

    if ($cssFile) {

        $css =
            Read-Utf8 $cssFile


        $cssMarker =
            "/* ATLAS EDITOR DE ESTRUTURAS V2 */"


        if (
            !$css.Contains(
                $cssMarker
            )
        ) {

            $novoCss = @'

/* ATLAS EDITOR DE ESTRUTURAS V2 */

.estrutura-editor-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.estrutura-ferramentas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.estrutura-tool {
  border: 1px solid rgba(0,0,0,.12);
  background: #fff;
  border-radius: 10px;
  padding: 9px 13px;
  cursor: pointer;
  transition: .15s ease;
}

.estrutura-tool:hover {
  transform: translateY(-1px);
}

.estrutura-tool.active {
  border-color: currentColor;
  box-shadow: 0 0 0 2px rgba(0,0,0,.06);
}

.estrutura-imagem-editor {
  position: relative;
  width: 100%;
  min-height: 320px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 14px;
  background: #111;
  border: 1px solid rgba(255,255,255,.08);
  user-select: none;
  touch-action: none;
}

.estrutura-imagem-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
  line-height: 0;
}

.estrutura-imagem {
  display: block;
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
  margin: 0 auto;
}

.estrutura-imagem-overlay {
  position: absolute;
  inset: 0;
  cursor: crosshair;
  touch-action: none;
}

.estrutura-imagem-placeholder {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
  color: rgba(255,255,255,.75);
}

.estrutura-editor-marcacao {
  position: absolute;
  box-sizing: border-box;
  pointer-events: auto;
}

.estrutura-editor-ponto {
  border: 3px solid #fff;
  border-radius: 50%;
  background: rgba(220,40,40,.85);
  box-shadow: 0 0 0 2px rgba(0,0,0,.5);
}

.estrutura-editor-retangulo {
  border: 3px solid #fff;
  background: rgba(220,40,40,.16);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35);
}

.estrutura-editor-seta {
  height: 4px;
  background: #fff;
  border-radius: 999px;
  transform-origin: 0 50%;
  box-shadow: 0 0 0 1px rgba(0,0,0,.5);
}

.estrutura-editor-seta::after {
  content: "";
  position: absolute;
  right: -1px;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 12px solid #fff;
  transform: translateY(-50%);
}

.estrutura-editor-texto {
  color: #fff;
  font-weight: 700;
  white-space: nowrap;
  text-shadow:
    0 1px 3px #000,
    0 -1px 3px #000;
  transform: translate(-50%, -50%);
}

.estrutura-preview {
  position: absolute;
  pointer-events: none;
  box-sizing: border-box;
}

.estrutura-preview-ponto {
  border: 3px solid #fff;
  border-radius: 50%;
  background: rgba(220,40,40,.85);
}

.estrutura-preview-retangulo {
  border: 3px dashed #fff;
  background: rgba(220,40,40,.15);
}

.estrutura-preview-seta {
  height: 4px;
  background: #fff;
  border-radius: 999px;
  transform-origin: 0 50%;
}

.estrutura-preview-seta::after {
  content: "";
  position: absolute;
  right: -1px;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 12px solid #fff;
  transform: translateY(-50%);
}

.estrutura-preview-texto {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 3px #000;
}

.estrutura-editor-ajuda {
  margin-top: 10px;
  font-size: .9rem;
  opacity: .75;
}

.estrutura-texto-editor {
  margin-top: 12px;
}

.estrutura-overlay {
  box-sizing: border-box;
  pointer-events: auto;
}

.estrutura-overlay-ponto {
  overflow: visible;
}

.estrutura-overlay-retangulo {
  overflow: visible;
}

.estrutura-overlay-seta {
  height: 4px;
  background: #fff;
  border-radius: 999px;
  transform-origin: 0 50%;
  box-shadow: 0 0 0 1px rgba(0,0,0,.5);
}

.estrutura-overlay-seta::after {
  content: "";
  position: absolute;
  right: -1px;
  top: 50%;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 12px solid #fff;
  transform: translateY(-50%);
}

.estrutura-overlay-texto {
  overflow: visible;
}

.estrutura-texto-label {
  display: block;
  color: #fff;
  font-weight: 700;
  white-space: nowrap;
  text-shadow:
    0 1px 3px #000,
    0 -1px 3px #000;
  transform: translateY(-50%);
}

.estrutura-box-retangulo {
  width: 100%;
  height: 100%;
  border: 3px solid #fff;
  background: rgba(220,40,40,.12);
  box-sizing: border-box;
}

.estrutura-box-ponto {
  width: 100%;
  height: 100%;
  position: relative;
}

.estrutura-box-ponto .estrutura-ponto {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(220,40,40,.9);
  border: 3px solid #fff;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 2px rgba(0,0,0,.5);
}

@media (max-width: 700px) {

  .estrutura-editor-toolbar {
    grid-template-columns: 1fr;
  }

  .estrutura-ferramentas {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

}

'@

            $css =
                $css.TrimEnd() +
                "`r`n`r`n" +
                $novoCss +
                "`r`n"

            Write-Utf8 $cssFile $css

            Write-Host "CSS atualizado."

        } else {

            Write-Host "CSS V2 já existe; não duplicando."

        }

    }

    # =========================================================
    # VALIDAÇÃO 1 - NODE CHECK
    # =========================================================

    Write-Host ""
    Write-Host "============================================================"
    Write-Host " VALIDANDO JAVASCRIPT"
    Write-Host "============================================================"

    & node --check $novaLamina

    if ($LASTEXITCODE -ne 0) {
        throw "node --check falhou em nova-lamina.js"
    }

    & node --check $mainJs

    if ($LASTEXITCODE -ne 0) {
        throw "node --check falhou em main.js"
    }

    Write-Host "JavaScript válido."

    # =========================================================
    # VALIDAÇÃO 2 - BUILD DO VITE
    # =========================================================

    Write-Host ""
    Write-Host "============================================================"
    Write-Host " EXECUTANDO BUILD DO VITE"
    Write-Host "============================================================"

    & npm run build

    if ($LASTEXITCODE -ne 0) {
        throw "npm run build falhou."
    }

    Write-Host ""
    Write-Host "============================================================"
    Write-Host " SUCESSO"
    Write-Host "============================================================"
    Write-Host ""

    Write-Host "Editor atualizado sem erro de sintaxe."
    Write-Host ""
    Write-Host "Backup mantido em:"
    Write-Host $backupDir
    Write-Host ""

    Write-Host "Novos tipos:"
    Write-Host "  Ponto"
    Write-Host "  Retângulo"
    Write-Host "  Seta"
    Write-Host "  Texto"
    Write-Host ""

    Write-Host "Agora execute:"
    Write-Host "  npm run dev"
    Write-Host ""

}
catch {

    Write-Host ""
    Write-Host "ERRO:"
    Write-Host $_.Exception.Message

    Restore-Backup

    Write-Host ""
    Write-Host "O projeto foi restaurado para a versão anterior."
    Write-Host ""

    exit 1
}