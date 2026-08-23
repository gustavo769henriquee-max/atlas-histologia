/*
 * FASE 20 — Função privilegiada para definir publicação da lâmina.
 *
 * EVIDÊNCIA (bisect em produção, 2026-08-22):
 * - Policies de public.laminas estão corretas no catálogo
 *   (UPDATE authenticated USING(true) WITH CHECK(true));
 * - Mesmo assim, UPDATE ... SET publicado = false falha com 42501
 *   ("new row violates row-level security policy"), inclusive
 *   executado como role authenticated DENTRO do banco;
 * - Updates que mantêm publicado = true funcionam normalmente.
 *
 * Anomalia de plataforma não reproduzível pela semântica padrão do
 * PostgreSQL. Solução mínima: SECURITY DEFINER (owner postgres,
 * relforcerowsecurity = false) contorna RLS para esta operação
 * específica. Uso exclusivo autenticado; anônimo não tem execução.
 */
create or replace function public.admin_definir_publicacao(
  p_lamina_id uuid,
  p_publicado boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_lamina_id is null then
    raise exception 'id da lâmina é obrigatório';
  end if;

  update public.laminas
     set publicado = coalesce(p_publicado, publicado),
         updated_at = now()
   where id = p_lamina_id;

  if not found then
    raise exception 'lâmina não encontrada';
  end if;
end;
$$;

revoke execute on function public.admin_definir_publicacao(uuid, boolean) from anon;
revoke execute on function public.admin_definir_publicacao(uuid, boolean) from public;
grant execute on function public.admin_definir_publicacao(uuid, boolean) to authenticated;
