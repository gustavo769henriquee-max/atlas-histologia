/*
 * FASE 20 — Diagnóstico profundo (REMOVER após uso).
 * 1) Flags da tabela, owner, rules (pg_rewrite);
 * 2) Testa UPDATE publicado=false COMO ROLE authenticated,
 *    simulando exatamente o caminho da aplicação.
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
select 'rule',
       rulename,
       ev_type::text,
       is_instead::text,
       coalesce(pg_get_ruledef(oid), ''),
       ''
from pg_rewrite
where ev_class = 'public.laminas'::regclass;

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

  /*
   * Sem "reset role": SET LOCAL reverte ao fim da transação do push.
   * Um RESET explícito quebraria o papel da conexão do CLI.
   */
  raise warning 'F20-TESTE-AUTHENTICATED: %', v_resultado;
end $$;
