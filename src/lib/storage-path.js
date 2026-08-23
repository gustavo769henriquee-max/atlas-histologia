/*
 * Extrai o caminho dentro do bucket "laminas" a partir da URL pública.
 * URL pública: .../storage/v1/object/public/laminas/laminas/<uuid>.<ext>
 * Caminho: laminas/<uuid>.<ext>
 *
 * Fonte única desta lógica (usada por nova-lamina.js e admin.js).
 */
export function extrairCaminhoArmazenamento(url) {
  if (!url) return null;

  const marcador = "/object/public/laminas/";

  const indice = url.indexOf(marcador);

  if (indice === -1) return null;

  const caminho = url.slice(indice + marcador.length);

  return caminho || null;
}
