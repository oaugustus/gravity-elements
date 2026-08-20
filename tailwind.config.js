'use strict';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,html}', './demo/**/*.{js,html}'],
  darkMode: 'class',
  safelist: require('./tailwind.safelist.json'),
  theme: {
    extend: {
      // Paridade Nuxt UI v4.10.0 (Tailwind v4): a classe `ring` sem sufixo
      // numérico virou 1px no TW4 (era 3px no TW3 — mudança documentada em
      // tailwindcss.com/docs/upgrade-guide#default-ring-width-and-color).
      // Os temas portados usam `ring ring-inset ring-[...]` copiado 1:1 do
      // upstream esperando 1px; sem este override, o TW 3.4.19 deste
      // projeto aplica o default antigo (3px), deixando toda borda/anel
      // (Alert, Avatar, Badge, Kbd etc.) visivelmente mais grossa que o
      // ui.nuxt.com — bug real apontado pelo usuário comparando o Alert.
      ringWidth: {
        DEFAULT: '1px',
      },
    },
  },
  plugins: [],
};
