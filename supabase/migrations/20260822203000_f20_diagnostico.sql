/*
 * FASE 20 — Diagnóstico temporário (REMOVER após uso).
 * Exporta policies e triggers de public.laminas para uma tabela
 * legível via REST, pois o CLI não expõe consultas ao banco remoto.
 */
drop table if exists public.f20_diagnostico;

create table public.f20_diagnostico as
  select
    'policy' as tipo,
    policyname as nome,
    cmd as detalhe1,
    array_to_string(roles, ',') as detalhe2,
    coalesce(qual::text, '') as detalhe3,
    coalesce(with_check::text, '') as detalhe4
  from pg_policies
  where schemaname = 'public' and tablename = 'laminas'
  union all
  select
    'trigger' as tipo,
    tgname as nome,
    '' as detalhe1,
    '' as detalhe2,
    coalesce(pg_get_triggerdef(oid), '') as detalhe3,
    '' as detalhe4
  from pg_trigger
  where tgrelid = 'public.laminas'::regclass and not tgisinternal;
