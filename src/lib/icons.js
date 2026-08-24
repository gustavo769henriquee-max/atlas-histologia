/*
 * Sistema de ícones vetoriais do Atlas.
 * SVGs inline leves (stroke = currentColor), sem dependências externas.
 * Uso: ${ icone.microscopio } dentro dos templates.
 */

const svg = (paths, viewBox = "0 0 24 24") =>
  `<svg class="icone" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const icone = {
  microscopio: svg(
    `<path d="M6 18h12"/><path d="M8 18v-2.5"/><path d="M16 18v-2.5"/><path d="M9.5 15.5h5"/><path d="M10.2 15.5a4.2 4.2 0 0 1-1.9-7.6l1.4-1a1.6 1.6 0 0 1 2.2.4l1.5 2.1a1.6 1.6 0 0 1-.4 2.2l-1.3 1a4.2 4.2 0 0 1-1.5 2.9z"/><path d="m11.6 5.6 1.5-1.1 2 2.8-1.5 1.1"/>`,
  ),
  lupa: svg(
    `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>`,
  ),
  camadas: svg(
    `<path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>`,
  ),
  expandir: svg(
    `<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>`,
  ),
  livro: svg(
    `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>`,
  ),
  pasta: svg(
    `<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/>`,
  ),
  paleta: svg(
    `<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>`,
  ),
  engrenagem: svg(
    `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  ),
  setaEsquerda: svg(`<path d="m15 18-6-6 6-6"/>`),
  setaDireita: svg(`<path d="m9 18 6-6-6-6"/>`),
  setaVoltar: svg(
    `<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,
  ),
  documento: svg(
    `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>`,
  ),
  olho: svg(
    `<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`,
  ),
  olhoFechado: svg(
    `<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 11s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>`,
  ),
  upload: svg(
    `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>`,
  ),
  salvar: svg(
    `<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>`,
  ),
  mais: svg(`<path d="M5 12h14"/><path d="M12 5v14"/>`),
  menos: svg(`<path d="M5 12h14"/>`),
  fechar: svg(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`),
  play: svg(
    `<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8z"/>`,
  ),
  imagem: svg(
    `<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>`,
  ),
  alvo: svg(
    `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
  ),
  zoom: svg(
    `<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>`,
  ),
  casa: svg(
    `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>`,
  ),
  check: svg(`<path d="M20 6 9 17l-5-5"/>`),
  alerta: svg(
    `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`,
  ),
  info: svg(
    `<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`,
  ),
  editar: svg(
    `<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>`,
  ),
  lixeira: svg(
    `<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>`,
  ),
  gota: svg(
    `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>`,
  ),
};

export default icone;
