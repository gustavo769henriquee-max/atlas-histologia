#!/usr/bin/env node
/*
 * VERIFICAÇÃO OBJETIVA DA COLUNA `tema` — public.configuracoes_site
 *
 * Uso:  node scripts/verificar-coluna-tema.mjs
 *
 * Somente LEITURA (usa a publishable key do .env). Informa:
 *   1. se a tabela configuracoes_site está acessível;
 *   2. se a coluna tema (jsonb) existe;
 *   3. quantos registros há e o valor atual de tema em cada um.
 *
 * Códigos de saída: 0 = coluna existe · 1 = tabela inacessível ·
 * 2 = coluna tema NÃO existe (migration pendente).
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((linha) => linha.includes("="))
    .map((linha) => {
      const i = linha.indexOf("=");

      return [
        linha.slice(0, i).trim(),
        linha.slice(i + 1).trim().replace(/^["']|["']$/g, ""),
      ];
    }),
);

const url = env.VITE_SUPABASE_URL;

const chave = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function consultar(colunas) {
  const resposta = await fetch(
    `${url}/rest/v1/configuracoes_site?select=${encodeURIComponent(colunas)}&limit=5`,
    { headers: { apikey: chave, Authorization: `Bearer ${chave}` } },
  );

  return { status: resposta.status, corpo: await resposta.text() };
}

console.log(`Supabase: ${url}\n`);

const tabela = await consultar("id");

if (tabela.status !== 200) {
  console.log(
    `✗ Tabela configuracoes_site INACESSÍVEL (HTTP ${tabela.status}):`,
    tabela.corpo,
  );
  process.exit(1);
}

console.log(
  `✓ Tabela acessível — ${JSON.parse(tabela.corpo).length} registro(s) visível(is).`,
);

const comTema = await consultar("id,tema");

if (comTema.status !== 200) {
  console.log("\n✗ COLUNA 'tema' NÃO EXISTE:", comTema.corpo);
  console.log(
    "\n→ Aplique a migration supabase/migrations/20260824120000_aparencia_tema_expandido.sql no SQL Editor do Supabase:\n\n" +
      "    alter table public.configuracoes_site add column if not exists tema jsonb;\n" +
      "    notify pgrst, 'reload_schema';\n",
  );
  process.exit(2);
}

console.log("\n✓ Coluna 'tema' EXISTE.\n");

for (const registro of JSON.parse(comTema.corpo)) {
  console.log(`  id=${registro.id} tema=${JSON.stringify(registro.tema)}`);
}

process.exit(0);
