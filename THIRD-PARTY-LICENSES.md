# Third-party licenses

O Gravity Elements é um port independente do design system do Nuxt UI para AngularJS, sem afiliação oficial com Nuxt Labs. Este arquivo lista as licenças de bibliotecas de terceiros usadas como dependência de código ou como referência de design/comportamento.

## Referências de design / comportamento

Estas bibliotecas **não** são dependências de código do Gravity Elements; servem como referência de API visual, tema e padrões de acessibilidade.

| Nome | Versão | Licença | Notas |
|---|---|---|---|
| Nuxt UI | n/a (referência) | MIT | Copyright (c) NuxtLabs — [github.com/nuxt/ui](https://github.com/nuxt/ui) |
| Reka UI | n/a (referência) | MIT | Copyright (c) UnoVue — [github.com/unovue/reka-ui](https://github.com/unovue/reka-ui) |

## Dependências de runtime

Versões conferidas em `node_modules/*/package.json` no momento da criação deste arquivo.

| Nome | Pacote npm | Versão instalada | Licença |
|---|---|---|---|
| AngularJS | `angular` (+ `angular-aria`, `angular-animate`) | 1.8.3 | MIT |
| Floating UI | `@floating-ui/dom` | 1.8.0 | MIT |
| focus-trap | `focus-trap` | 7.8.0 | MIT |
| tabbable | `tabbable` | 6.5.0 | MIT |
| Mousetrap | `mousetrap` | 1.6.5 | Apache-2.0 WITH LLVM-exception |
| date-fns | `date-fns` | 4.4.0 | MIT |
| tailwind-merge | `tailwind-merge` | 3.6.0 | MIT |
| Pickr | `@simonwep/pickr` | 1.10.1 | MIT |

## Dependências de desenvolvimento (CSS)

| Nome | Pacote npm | Versão instalada | Licença | Notas |
|---|---|---|---|---|
| Tailwind CSS | `tailwindcss` | 3.4.19 | MIT | CLI/PostCSS; gera `dist/gravity-elements.css` |
