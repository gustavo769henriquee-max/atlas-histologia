/*
 * REDESIGN VISUAL — vídeo opcional nas lâminas + campos
 * institucionais e cores extras em configuracoes_site.
 *
 * Migration NÃO destrutiva:
 * - apenas ADICIONA colunas novas (if not exists);
 * - não altera dados existentes;
 * - não altera políticas de RLS.
 */

-- Vídeo opcional exibido condicionalmente na página da lâmina.
alter table public.laminas add column if not exists video_url text;

-- Identidade: cor secundária e cor de destaque/acento (painel Aparência).
alter table public.configuracoes_site
  add column if not exists cor_secundaria text;

alter table public.configuracoes_site
  add column if not exists cor_acento text;

-- Informações institucionais (página Configurações).
alter table public.configuracoes_site
  add column if not exists nome_institucional text;

alter table public.configuracoes_site
  add column if not exists contato_email text;

alter table public.configuracoes_site
  add column if not exists link_institucional text;

alter table public.configuracoes_site
  add column if not exists creditos text;

-- Recarrega o schema no cache do PostgREST.
notify pgrst, 'reload_schema';
