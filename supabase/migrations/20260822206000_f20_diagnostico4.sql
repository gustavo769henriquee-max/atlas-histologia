/*
 * FASE 20 — Dump BRUTO de pg_policy (catálogo, não a view).
 * Revela expressões reais, permissivo/restritivo e roles exatos.
 */
delete from public.f20_diagnostico;

insert into public.f20_diagnostico (tipo, nome, detalhe1, detalhe2, detalhe3, detalhe4)
select
  'raw_policy',
  p.polname::text,
  p.polcmd::text,
  case when p.polpermissive then 'permissive' else 'RESTRICTIVE' end,
  array_to_string(array(select r.rolname from pg_roles r where r.oid = any(p.polroles)), ','),
  coalesce(pg_get_expr(p.polqual, p.polrelid), '') ||
    ' ##WC## ' ||
    coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')
from pg_policy p
where p.polrelid = 'public.laminas'::regclass;
