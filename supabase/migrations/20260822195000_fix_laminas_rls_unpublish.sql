/*
 * FASE 20 — Correção de RLS: permitir despublicar (publicado = false).
 *
 * EVIDÊNCIA (smoke test autenticado em produção, 2026-08-22):
 *   UPDATE laminas SET publicado = false
 *   → erro "new row violates row-level security policy"
 *   Updates que mantêm publicado = true funcionam normalmente.
 *
 * Causa: policy(s) de UPDATE/INSERT em public.laminas diferentes do
 * design documentado em 20260818152247_fix_laminas_rls.sql — com
 * WITH CHECK restritivo quanto a publicado — impedindo o admin de
 * ocultar uma lâmina pela aplicação.
 *
 * Correção mínima e idempotente: remove TODAS as policies existentes
 * em public.laminas e recria exatamente as 4 do design original.
 * Não altera dados. Não altera lamina_imagens nem Storage.
 */

do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'laminas'
  loop
    execute format('drop policy if exists %I on public.laminas', r.policyname);
  end loop;
end $$;


create policy "Public can view published laminas"
on public.laminas
for select
to public
using (
  publicado = true
);


create policy "Authenticated users can create laminas"
on public.laminas
for insert
to authenticated
with check (
  true
);


create policy "Authenticated users can update laminas"
on public.laminas
for update
to authenticated
using (
  true
)
with check (
  true
);


create policy "Authenticated users can delete laminas"
on public.laminas
for delete
to authenticated
using (
  true
);
