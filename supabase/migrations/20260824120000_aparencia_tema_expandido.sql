/*
 * EXPANSÃO DO SISTEMA DE APARÊNCIA — tema completo em JSONB.
 *
 * Migration NÃO destrutiva:
 * - apenas ADICIONA a coluna `tema` (if not exists);
 * - não altera dados existentes;
 * - não altera políticas de RLS nem autenticação.
 *
 * Todas as novas opções do painel Aparência (cores gerais, header,
 * hero, cards, catálogo, lâmina, visualizador, vídeo, rodapé,
 * administração, formulários, botões, estados semânticos e
 * tipografia) são persistidas neste único objeto JSON.
 *
 * O código funciona mesmo ANTES desta migration ser aplicada:
 * o salvamento é resiliente (remove `tema` do payload se a coluna
 * ainda não existir) e o site usa fallbacks seguros.
 */

alter table public.configuracoes_site
  add column if not exists tema jsonb;

-- Recarrega o schema no cache do PostgREST.
notify pgrst, 'reload_schema';
