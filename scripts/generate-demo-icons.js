'use strict';

/**
 * Gera `demo/demo-icons.css` com ícones reais (Lucide, via @iconify-json/lucide)
 * pras classes `i-lucide-*` que os componentes já usam internamente como classe
 * CSS pura (Alert/Banner `i-lucide-x`, Calendar `i-lucide-chevron-left/right`,
 * Theme `i-lucide-sun`/`i-lucide-moon`, Button `i-lucide-loader-circle`) e pro
 * showcase do geIcon.
 *
 * Isso é só pro demo — não altera `src/`, `tailwind.config.js` nem
 * `dist/gravity-elements.css` (o CSS publicado da lib). Mantém intacta a
 * decisão de escopo do §5.4 do spec: "Gravity Elements não empacota um sistema
 * de ícones... cabe ao app consumidor registrar uma fonte de ícones
 * compatível (ex.: Iconify)". O demo, como um app consumidor, só está seguindo
 * essa recomendação pra si mesmo.
 *
 * Nota técnica: tentei primeiro via plugin Tailwind (@egoist/tailwindcss-icons
 * com matchComponents), mas ele não gerava nenhuma regra através do CLI do
 * Tailwind 3.4.19 desse projeto (nem com safelist explícito) — provável
 * incompatibilidade de versão do plugin. Como só precisamos de ~6 ícones fixos
 * (não JIT dinâmico), gerar estático direto do JSON do Iconify é mais simples
 * e não depende de nenhum plugin de terceiro nesse ponto da cadeia.
 */

const fs = require('fs');
const path = require('path');

// github.com/iconify/icon-sets, coleção "lucide" (MIT/ISC — ver @iconify-json/lucide)
const lucide = require('@iconify-json/lucide/icons.json');

// Nomes usados de fato pelos componentes em produção (confirmado via
// `grep -rEo "i-lucide-[a-z-]+" src/ demo/`), excluindo classes que só
// aparecem em specs Jasmine (i-lucide-user, i-lucide-check, i-lucide-star,
// i-lucide-bug — não renderizadas no demo real), MAIS os ícones usados nos
// exemplos do demo equalizados com ui.nuxt.com (2026-08-10 — ver spec §9.7).
const ICON_NAMES = [
  'chevron-left', // Calendar: mês anterior
  'chevron-right', // Calendar: próximo mês
  'x', // Alert / Banner: botão fechar
  'sun', // Theme: toggle claro
  'moon', // Theme: toggle escuro
  'loader-circle', // Button: spinner de loading
  'terminal', // Alert: exemplo "Icon"
  'arrow-right', // Alert/Badge: exemplo "Close Icon"/"Trailing icon"
  'file-x', // Error: exemplo "Icon"
  'rocket', // Badge/Button: exemplo "Icon"
  'info', // Banner: exemplo "Icon"
  'x-circle', // Banner: exemplo "Close Icon"
  'search', // Button: exemplo icon-only
  'mail', // Chip: exemplo "Usage" (botão com ícone)
  'chevron-down', // Collapsible/FieldGroup: exemplo "Usage"
  'lightbulb', // Icon: exemplo "Usage"
];

const width = lucide.width || 24;
const height = lucide.height || 24;

function svgDataUri(body) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22')}")`;
}

// Alguns nomes usados pela doc do Nuxt UI (ex. "x-circle") são aliases no
// pacote @iconify-json/lucide, não entradas diretas de `icons` — resolve via
// `aliases[name].parent` quando `icons[name]` não existir.
function resolveIcon(name) {
  if (lucide.icons[name]) {
    return lucide.icons[name];
  }
  const alias = lucide.aliases && lucide.aliases[name];
  if (alias && lucide.icons[alias.parent]) {
    return lucide.icons[alias.parent];
  }
  return null;
}

const rules = ICON_NAMES.map(function (name) {
  const icon = resolveIcon(name);
  if (!icon) {
    throw new Error('Ícone Lucide não encontrado: ' + name);
  }
  const uri = svgDataUri(icon.body);
  return (
    `.i-lucide-${name} {\n` +
    `  display: inline-block;\n` +
    `  width: 1em;\n` +
    `  height: 1em;\n` +
    `  background-color: currentColor;\n` +
    `  -webkit-mask-image: ${uri};\n` +
    `  mask-image: ${uri};\n` +
    `  -webkit-mask-repeat: no-repeat;\n` +
    `  mask-repeat: no-repeat;\n` +
    `  -webkit-mask-size: 100% 100%;\n` +
    `  mask-size: 100% 100%;\n` +
    `}`
  );
});

const banner =
  '/* GERADO por scripts/generate-demo-icons.js — não editar à mão. */\n' +
  '/* Fonte de ícones (Lucide/Iconify) só pro demo — ver comentário do script. */\n\n';

const output = banner + rules.join('\n\n') + '\n';

const outPath = path.join(__dirname, '..', 'demo', 'demo-icons.css');
fs.writeFileSync(outPath, output);
console.log('Wrote demo/demo-icons.css (' + ICON_NAMES.length + ' ícones Lucide)');
