/*
 * FASE 20 — Policy de SELECT para usuários autenticados.
 *
 * EVIDÊNCIA (smoke test parte 8): após ocultar uma lâmina, o admin
 * não consegue mais carregá-la na edição ("Não foi possível carregar
 * esta lâmina") nem vê-la na lista administrativa — pois não existia
 * policy SELECT para authenticated (autenticados só enxergavam via
 * policy pública, que exige publicado = true).
 *
 * Autenticados passam a ver TODAS as lâminas; o público continua
 * limitado às publicadas. Não altera dados.
 */
create policy "Authenticated users can view all laminas"
on public.laminas
for select
to authenticated
using (
  true
);
