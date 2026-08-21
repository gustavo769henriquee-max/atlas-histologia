$ErrorActionPreference = "Stop"

$root = Get-Location

Write-Host ""
Write-Host "============================================================"
Write-Host " REPARADOR SEGURO - ATLAS HISTOLOGICO"
Write-Host "============================================================"
Write-Host ""

# ------------------------------------------------------------
# ARQUIVOS
# ------------------------------------------------------------

$nova = Join-Path $root "src\pages\nova-lamina.js"
$main = Join-Path $root "src\main.js"

if (!(Test-Path $nova)) {
    Write-Host "[ERRO] src\pages\nova-lamina.js nao encontrado." -ForegroundColor Red
    exit 1
}

if (!(Test-Path $main)) {
    Write-Host "[ERRO] src\main.js nao encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Arquivos principais encontrados." -ForegroundColor Green

# ------------------------------------------------------------
# BACKUP
# ------------------------------------------------------------

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $root "backup-reparo-$timestamp"

New-Item -ItemType Directory -Path $backup | Out-Null

Copy-Item $nova (Join-Path $backup "nova-lamina.js")
Copy-Item $main (Join-Path $backup "main.js")

$cssFiles = Get-ChildItem -Path $root -Recurse -Filter "*.css" |
    Where-Object {
        $_.FullName -notmatch "\\node_modules\\" -and
        $_.FullName -notmatch "\\dist\\"
    }

foreach ($css in $cssFiles) {
    $relative = $css.FullName.Substring($root.Path.Length).TrimStart("\")
    $destination = Join-Path $backup $relative
    $destinationDir = Split-Path $destination -Parent

    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    Copy-Item $css.FullName $destination
}

Write-Host "[OK] Backup criado:" -ForegroundColor Green
Write-Host $backup
Write-Host ""

# ------------------------------------------------------------
# LEITURA
# ------------------------------------------------------------

$novaContent = Get-Content $nova -Raw -Encoding UTF8
$mainContent = Get-Content $main -Raw -Encoding UTF8

Write-Host "[OK] Arquivos lidos." -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# FUNCAO DE VERIFICACAO
# ------------------------------------------------------------

$problemas = New-Object System.Collections.Generic.List[string]

function Test-Contains {
    param(
        [string]$Text,
        [string]$Name,
        [string]$Pattern
    )

    if ($Text.Contains($Pattern)) {
        Write-Host "[OK] $Name" -ForegroundColor Green
    }
    else {
        Write-Host "[ERRO] $Name" -ForegroundColor Red
        $script:problemas.Add($Name)
    }
}

# ------------------------------------------------------------
# NOVA LAMINA - ESTRUTURAS
# ------------------------------------------------------------

Write-Host "------------------------------------------------------------"
Write-Host " VERIFICANDO EDITOR DE ESTRUTURAS"
Write-Host "------------------------------------------------------------"

Test-Contains $novaContent "Array de estruturas" "let estruturas"
Test-Contains $novaContent "Lista de estruturas" "estruturas-lista"
Test-Contains $novaContent "Botao adicionar" "adicionar-estrutura"

# Tipos novos
Test-Contains $novaContent "Tipo ponto" "ponto"
Test-Contains $novaContent "Tipo retangulo" "retangulo"
Test-Contains $novaContent "Tipo seta" "seta"
Test-Contains $novaContent "Tipo texto" "texto"

# Compatibilidade antiga
Test-Contains $novaContent "Normalizacao" "normalizarEstrutura"
Test-Contains $novaContent "Salvar estruturas" "estruturasNormalizadas"

Write-Host ""

# ------------------------------------------------------------
# NOVA LAMINA - IMAGEM
# ------------------------------------------------------------

Write-Host "------------------------------------------------------------"
Write-Host " VERIFICANDO UPLOAD DE IMAGEM"
Write-Host "------------------------------------------------------------"

Test-Contains $novaContent "Campo imagem" 'id="imagem"'
Test-Contains $novaContent "FormData" "new FormData"
Test-Contains $novaContent "Arquivo imagem" "formData.get"
Test-Contains $novaContent "Validacao MIME" "startsWith"
Test-Contains $novaContent "Supabase Storage" ".storage"
Test-Contains $novaContent "Bucket laminas" '.from("laminas")'
Test-Contains $novaContent "Upload" ".upload("
Test-Contains $novaContent "URL publica" "getPublicUrl"

Write-Host ""

# ------------------------------------------------------------
# NOVA LAMINA - BANCO
# ------------------------------------------------------------

Write-Host "------------------------------------------------------------"
Write-Host " VERIFICANDO SUPABASE"
Write-Host "------------------------------------------------------------"

Test-Contains $novaContent "Tabela laminas" '.from("laminas")'
Test-Contains $novaContent "Campo estruturas" "estruturas:"
Test-Contains $novaContent "Campo publicado" "publicado"
Test-Contains $novaContent "Campo categoria" "categoria_id"

Write-Host ""

# ------------------------------------------------------------
# MAIN.JS
# ------------------------------------------------------------

Write-Host "------------------------------------------------------------"
Write-Host " VERIFICANDO VISUALIZADOR"
Write-Host "------------------------------------------------------------"

Test-Contains $mainContent "Renderizacao estruturas" "desenharEstruturas"
Test-Contains $mainContent "Estruturas" "estruturas"
Test-Contains $mainContent "Tiled Image" "TiledImage"
Test-Contains $mainContent "OpenSeadragon" "OpenSeadragon"

Write-Host ""

# ------------------------------------------------------------
# VERIFICACAO DE DUPLICACAO DE VARIAVEIS
# ------------------------------------------------------------

Write-Host "------------------------------------------------------------"
Write-Host " PROCURANDO DECLARACOES SUSPEITAS"
Write-Host "------------------------------------------------------------"

$declaracoes = @(
    "const estruturas",
    "let estruturas",
    "const viewer",
    "let viewer"
)

foreach ($declaracao in $declaracoes) {

    $matches = [regex]::Matches(
        $novaContent,
        [regex]::Escape($declaracao)
    )

    if ($matches.Count -gt 1 -and $declaracao -eq "let estruturas") {

        Write-Host "[AVISO] $declaracao aparece $($matches.Count) vezes em nova-lamina.js" -ForegroundColor Yellow

    }
}

Write-Host ""

# ------------------------------------------------------------
# NODE CHECK
# ------------------------------------------------------------

Write-Host "============================================================"
Write-Host " VALIDANDO JAVASCRIPT"
Write-Host "============================================================"
Write-Host ""

$nodePath = Get-Command node -ErrorAction SilentlyContinue

if (!$nodePath) {

    Write-Host "[ERRO] Node.js nao encontrado." -ForegroundColor Red
    exit 1

}

node --check $nova

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "[ERRO] nova-lamina.js possui erro de sintaxe." -ForegroundColor Red
    Write-Host ""
    Write-Host "Nenhuma alteracao automatica foi feita."
    Write-Host "Backup:"
    Write-Host $backup
    exit 1

}

Write-Host "[OK] nova-lamina.js possui sintaxe valida." -ForegroundColor Green

node --check $main

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "[ERRO] main.js possui erro de sintaxe." -ForegroundColor Red
    Write-Host ""
    Write-Host "Nenhuma alteracao automatica foi feita."
    Write-Host "Backup:"
    Write-Host $backup
    exit 1

}

Write-Host "[OK] main.js possui sintaxe valida." -ForegroundColor Green

Write-Host ""

# ------------------------------------------------------------
# PROBLEMAS ENCONTRADOS
# ------------------------------------------------------------

if ($problemas.Count -gt 0) {

    Write-Host "============================================================"
    Write-Host " PROBLEMAS ENCONTRADOS"
    Write-Host "============================================================"
    Write-Host ""

    foreach ($problema in $problemas) {
        Write-Host "[!] $problema" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "O reparador NAO vai modificar o codigo automaticamente."
    Write-Host "Isso evita destruir uma parte funcional do site."
    Write-Host ""
    Write-Host "Backup:"
    Write-Host $backup

    exit 2
}

# ------------------------------------------------------------
# BUILD
# ------------------------------------------------------------

Write-Host "============================================================"
Write-Host " EXECUTANDO BUILD DO VITE"
Write-Host "============================================================"
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {

    Write-Host ""
    Write-Host "[ERRO] O build do Vite falhou." -ForegroundColor Red
    Write-Host ""
    Write-Host "O codigo nao foi alterado."
    Write-Host ""
    Write-Host "Backup:"
    Write-Host $backup

    exit 1
}

# ------------------------------------------------------------
# RESULTADO
# ------------------------------------------------------------

Write-Host ""
Write-Host "============================================================"
Write-Host " DIAGNOSTICO CONCLUIDO"
Write-Host "============================================================"
Write-Host ""

Write-Host "[OK] JavaScript valido." -ForegroundColor Green
Write-Host "[OK] main.js valido." -ForegroundColor Green
Write-Host "[OK] Editor de estruturas encontrado." -ForegroundColor Green
Write-Host "[OK] Sistema de imagem encontrado." -ForegroundColor Green
Write-Host "[OK] Supabase Storage encontrado." -ForegroundColor Green
Write-Host "[OK] Estruturas encontradas." -ForegroundColor Green
Write-Host "[OK] Build do Vite concluido." -ForegroundColor Green

Write-Host ""
Write-Host "Backup mantido em:"
Write-Host $backup

Write-Host ""
Write-Host "============================================================"
Write-Host " ATLAS VALIDADO"
Write-Host "============================================================"
Write-Host ""
```
