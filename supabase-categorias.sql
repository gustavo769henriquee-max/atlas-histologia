-- ============================================================
-- ATLAS HISTOLÓGICO
-- PARTE 4 — CATEGORIAS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- TABELA
-- ============================================================

create table if not exists public.categorias (

  id uuid primary key default gen_random_uuid(),

  nome text not null,

  descricao text,

  ativo boolean not null default true,

  ordem integer not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);


-- ============================================================
-- NOME ÚNICO
-- ============================================================

create unique index if not exists
categorias_nome_lower_unique
on public.categorias (
  lower(trim(nome))
);


-- ============================================================
-- ÍNDICE
-- ============================================================

create index if not exists
categorias_ordem_idx
on public.categorias (
  ordem,
  nome
);


-- ============================================================
-- RLS
-- ============================================================

alter table public.categorias
enable row level security;


-- ============================================================
-- LEITURA PÚBLICA
-- Categorias ativas podem ser usadas pelo catálogo.
-- ============================================================

drop policy if exists
"categorias_publicas_select"
on public.categorias;

create policy
"categorias_publicas_select"
on public.categorias

for select

using (
  ativo = true
  or
  auth.uid() is not null
);


-- ============================================================
-- ADMIN
-- ============================================================

drop policy if exists
"categorias_admin_insert"
on public.categorias;

create policy
"categorias_admin_insert"
on public.categorias

for insert

to authenticated

with check (
  true
);


drop policy if exists
"categorias_admin_update"
on public.categorias;

create policy
"categorias_admin_update"
on public.categorias

for update

to authenticated

using (
  true
)

with check (
  true
);


drop policy if exists
"categorias_admin_delete"
on public.categorias;

create policy
"categorias_admin_delete"
on public.categorias

for delete

to authenticated

using (
  true
);


-- ============================================================
-- CATEGORIAS INICIAIS
-- Só serão criadas se ainda não existirem.
-- ============================================================

insert into public.categorias
  (nome, descricao, ordem)

values

  (
    'Tecido epitelial',
    'Lâminas relacionadas aos tecidos epiteliais.',
    1
  ),

  (
    'Tecido conjuntivo',
    'Lâminas relacionadas aos tecidos conjuntivos.',
    2
  ),

  (
    'Tecido muscular',
    'Lâminas relacionadas ao tecido muscular.',
    3
  ),

  (
    'Tecido nervoso',
    'Lâminas relacionadas ao tecido nervoso.',
    4
  ),

  (
    'Órgãos',
    'Lâminas de órgãos e sistemas.',
    5
  )

on conflict (
  lower(trim(nome))
)

do nothing;


-- ============================================================
-- FUNÇÃO updated_at
-- ============================================================

create or replace function
public.atualizar_updated_at_categorias()

returns trigger

language plpgsql

as $$
begin

  new.updated_at = now();

  return new;

end;
$$;


-- ============================================================
-- TRIGGER
-- ============================================================

drop trigger if exists
categorias_updated_at
on public.categorias;

create trigger
categorias_updated_at

before update
on public.categorias

for each row

execute function
public.atualizar_updated_at_categorias();


-- ============================================================
-- FINAL
-- ============================================================

select *

from public.categorias

order by ordem, nome;
