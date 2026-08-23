/*
 * FASE 20 — Limpeza final dos dados de teste e da tabela de diagnóstico.
 *
 * Remove quaisquer lâminas "[TESTE F20] ..." (incluindo ocultas,
 * invisíveis a consultas anônimas). O CASCADE remove suas linhas em
 * lamina_imagens; os arquivos correspondentes permanecem no Storage
 * (comportamento atual da exclusão, documentado no relatório).
 * Em seguida remove a tabela temporária de diagnóstico.
 */
delete from public.laminas where nome like '%[TESTE F20]%';

drop table if exists public.f20_diagnostico;
