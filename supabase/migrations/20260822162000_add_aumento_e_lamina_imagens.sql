/*
 * FASE 18 — Aumento + múltiplas imagens por lâmina
 *
 * Migration NÃO destrutiva:
 * - NÃO remove `laminas.imagem_url` (mantida como fallback);
 * - NÃO altera dados existentes;
 * - `aumento` é TEXT (ex.: "40×", "1000× óleo") — coerente com o
 *   modelo texto-livre adotado por nome/categoria/técnica/coloração.
 */

-- Aumento real da observação (não confunde com zoom digital do viewer).
alter table public.laminas add column if not exists aumento text;

-- Imagens múltiplas. lamina_id referencia laminas(id) (uuid).
-- on delete cascade: ao remover uma lâmina, suas fotos são lidadas
-- (aplicação remove arquivos do Storage antes/após; a linha segue o CASCADE).
create table if not exists public.lamina_imagens (
  id           uuid primary key default gen_random_uuid(),
  lamina_id    uuid not null references public.laminas(id) on delete cascade,
  imagem_url   text not null,
  ordem        integer not null default 0,
  created_at   timestamp with time zone default now()
);

create index if not exists idx_lamina_imagens_lamina_id  on public.lamina_imagens (lamina_id);
create index if not exists idx_lamina_imagens_ordem       on public.lamina_imagens (lamina_id, ordem);

-- RLS: mesma semântica de `laminas` (publicado).
alter table public.lamina_imagens enable row level security;

-- Público: consulta imagens SOMENTE de lâminas PUBLICADAS.
create policy "Public can view images of published laminas"
on public.lamina_imagens
for select
to public
using (
  exists (
    select 1
    from public.laminas l
    where l.id = lamina_imagens.lamina_id
      and l.publicado = true
  )
);

-- Autenticado: CRUD completo (insert/update/delete/select).
create policy "Authenticated users can manage lamina images"
on public.lamina_imagens
for all
to authenticated
using (true)
with check (true);
