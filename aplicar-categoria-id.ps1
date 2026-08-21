$arquivo = ".\src\pages\nova-lamina.js"

Write-Host ""
Write-Host "Verificando arquivo..." -ForegroundColor Cyan

if (-not (Test-Path $arquivo)) {
    Write-Host "ERRO: arquivo nao encontrado: $arquivo" -ForegroundColor Red
    exit 1
}

$conteudo = Get-Content $arquivo -Raw

$alteracoes = 0


# ============================================================
# 1. SELECT DE CATEGORIAS
# ============================================================

$padraoSelect = "option\.value\s*=\s*\r?\n\s*categoria\.nome"

if ($conteudo -match $padraoSelect) {

    $conteudo = [regex]::Replace(
        $conteudo,
        $padraoSelect,
        "option.value =`r`n          categoria.id",
        1
    )

    $alteracoes++

    Write-Host "OK: select de categorias agora usa categoria.id" -ForegroundColor Green

}
else {

    Write-Host "AVISO: select ja parece estar corrigido ou nao foi encontrado." -ForegroundColor Yellow

}


# ============================================================
# 2. FORMULARIO - categoria -> categoriaId
# ============================================================

$padraoCategoria = @"
const categoria\s*=\s*
\s*String\(
\s*formData\.get\('categoria'\)\s*\|\|\s*''\s*
\)\.trim\(\)
"@

if ($conteudo -match $padraoCategoria) {

    $substitutoCategoria = @"
const categoriaId =
      String(
        formData.get('categoria') || ''
      ).trim()
"@

    $conteudo = [regex]::Replace(
        $conteudo,
        $padraoCategoria,
        $substitutoCategoria,
        1
    )

    $alteracoes++

    Write-Host "OK: variavel categoria alterada para categoriaId" -ForegroundColor Green

}
else {

    Write-Host "AVISO: variavel categoria ja foi alterada ou nao foi encontrada." -ForegroundColor Yellow

}


# ============================================================
# 3. OBJETO DE SALVAMENTO
# ============================================================

$padraoDados = @"
categoria,

\s*tecnica,
"@

if ($conteudo -match $padraoDados) {

    $substitutoDados = @"
categoria_id: categoriaId || null,

      tecnica,
"@

    $conteudo = [regex]::Replace(
        $conteudo,
        $padraoDados,
        $substitutoDados,
        1
    )

    $alteracoes++

    Write-Host "OK: salvamento agora usa categoria_id" -ForegroundColor Green

}
else {

    Write-Host "AVISO: bloco de salvamento ja foi alterado ou nao foi encontrado." -ForegroundColor Yellow

}


# ============================================================
# 4. CARREGAMENTO DA CATEGORIA AO EDITAR
# ============================================================

$padraoCarregarCategoria = @"
await carregarCategoriasLamina\(
\s*data\.categoria\s*\|\|\s*''\s*
\)
"@

if ($conteudo -match $padraoCarregarCategoria) {

    $substitutoCarregarCategoria = @"
await carregarCategoriasLamina(
    data.categoria_id || ''
  )
"@

    $conteudo = [regex]::Replace(
        $conteudo,
        $padraoCarregarCategoria,
        $substitutoCarregarCategoria,
        1
    )

    $alteracoes++

    Write-Host "OK: edicao agora carrega categoria_id" -ForegroundColor Green

}
else {

    Write-Host "AVISO: carregamento da categoria ja foi alterado ou nao foi encontrado." -ForegroundColor Yellow

}


# ============================================================
# 5. VALOR DO OPTION
# ============================================================

$padraoValorAtual = @"
if \(
\s*categoria\.nome ===
\s*valorAtual
\s*\)
"@

if ($conteudo -match $padraoValorAtual) {

    $substitutoValorAtual = @"
if (
          String(categoria.id) ===
          String(valorAtual)
        )
"@

    $conteudo = [regex]::Replace(
        $conteudo,
        $padraoValorAtual,
        $substitutoValorAtual,
        1
    )

    $alteracoes++

    Write-Host "OK: selecao da categoria na edicao corrigida" -ForegroundColor Green

}
else {

    Write-Host "AVISO: comparacao da categoria ja foi alterada ou nao foi encontrada." -ForegroundColor Yellow

}


# ============================================================
# 6. GARANTIR QUE categoria_id EXISTE NO OBJETO
# ============================================================

if (
    $conteudo -match "categoria_id:\s*categoriaId\s*\|\|\s*null"
) {

    Write-Host "OK: categoria_id esta presente no salvamento." -ForegroundColor Green

}
else {

    Write-Host "ERRO: categoria_id nao foi encontrado no salvamento." -ForegroundColor Red
    Write-Host "Nenhuma alteracao adicional sera feita." -ForegroundColor Yellow

    exit 1
}


# ============================================================
# 7. BACKUP
# ============================================================

$backup = "$arquivo.backup"

Copy-Item $arquivo $backup -Force

Write-Host ""
Write-Host "Backup criado:" -ForegroundColor Cyan
Write-Host $backup


# ============================================================
# 8. SALVAR
# ============================================================

Set-Content `
    -Path $arquivo `
    -Value $conteudo `
    -Encoding UTF8


# ============================================================
# FINAL
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " ALTERACAO CONCLUIDA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Arquivo:" -ForegroundColor Cyan
Write-Host $arquivo

Write-Host ""
Write-Host "Alteracoes realizadas: $alteracoes" -ForegroundColor Cyan

Write-Host ""
Write-Host "Backup:" -ForegroundColor Cyan
Write-Host $backup

Write-Host ""
Write-Host "Agora execute:" -ForegroundColor Yellow
Write-Host "npm.cmd run dev" -ForegroundColor White
Write-Host ""