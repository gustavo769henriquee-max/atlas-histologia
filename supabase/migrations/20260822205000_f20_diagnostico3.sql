/*
 * FASE 20 — Diagnóstico profundo parte 2 (REMOVER após uso).
 * Executa o UPDATE publicado=false como role authenticated e GRAVA
 * o resultado em f20_diagnostico (INSERT concedido temporariamente).
 */
delete from public.f20_diagnostico;

insert into public.f20_diagnostico (tipo, nome, detalhe1, detalhe2, detalhe3, detalhe4)
select 'tabela',
       relname::text,
       relrowsecurity::text,
       relforcerowsecurity::text,
       pg_get_userbyid(relowner),
       relkind::text
from pg_class
where oid = 'public.laminas'::regclass;

insert into public.f20_diagnostico (tipo, nome, detalhe1, detalhe2, detalhe3, detalhe4)
select 'rule', rulename, ev_type::text, is_instead::text,
       coalesce(pg_get_ruledef(oid), ''), ''
from pg_rewrite
where ev_class = 'public.laminas'::regclass;

grant insert on public.f20_diagnostico to authenticated;

do $$
declare
  v_id uuid;
  v_resultado text;
begin
  select id into v_id from public.laminas order by created_at desc limit 1;

  begin
    set local role authenticated;
    update public.laminas set publicado = false where id = v_id;
    update public.laminas set publicado = true where id = v_id;
    v_resultado := 'OK: update como authenticated funcionou';
  exception when others then
    v_resultado := 'ERRO ' || SQLSTATE || ': ' || SQLERRM;
  end;

  /* ainda como authenticated: grava o resultado */
  insert into public.f20_diagnostico (tipo, nome, detalhe1)
  values ('teste_authenticated', 'update_publicado_false', left(v_resultado, 250));
end $$;

revoke insert on public.f20_diagnostico from authenticated;
