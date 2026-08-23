/*
 * FASE 20 — Recarrega o cache de schema do PostgREST (Supabase API).
 *
 * A migration 20260822195000 corrigiu as policies de public.laminas,
 * mas o supabase CLI aplica SQL direto no banco sem notificar o
 * PostgREST, que continuou enforceando as policies antigas em cache
 * (evidência: erro "new row violates row-level security policy"
 * persistiu após o push).
 */
notify pgrst, 'reload schema';
