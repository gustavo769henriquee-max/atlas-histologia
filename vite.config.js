import { defineConfig } from "vite";

/*
 * base: './' gera caminhos de ativos RELATIVOS, o que permite que o
 * build funcione tanto em domínio raiz quanto em subpastas
 * (ex.: GitHub Pages em /<repo>/). A SPA usa hash-routing (#/...),
 * então não há necessidade de fallback de SPA no servidor.
 */
export default defineConfig({
  base: "./",
});
