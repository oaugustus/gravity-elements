Você vai corrigir um bug encontrado na revisão da tarefa "Componente: Banner" do projeto
Gravity Elements, definida em specs/spec-etapa-1-layout-element.md deste repositório.
A tarefa NÃO foi marcada como concluída no TickTick por causa deste bug — ainda está em
aberto.

Bug (confirmado por build isolado do Tailwind CLI, fora do jsdom, sem ambiguidade — mesmo
método usado pra achar o bug do Alert):

Em src/components/element/banner/banner.theme.js, o variant `to` usa:

  root: 'outline-[color-mix(in_srgb,var(--ui-bg)_25%,transparent)] -outline-offset-3 has-[>a:focus-visible]:outline-3'

`-outline-offset-3` e `has-[>a:focus-visible]:outline-3` NÃO geram CSS nenhum no Tailwind
3.4.19 deste projeto — testado isoladamente com `npx tailwindcss` num fixture mínimo:
zero regras de saída pra `outline-3`/`-outline-offset-3`, mesmo com a classe presente na
safelist. Causa raiz (diferente do bug do Alert): não é sobre `color-mix()`/opacidade —
é que a escala padrão de `outline-width` do Tailwind v3 só aceita os valores fixos
0/1/2/4/8 (confirmado: `outline-1`, `outline-2`, `outline-4`, `outline-8` compilam,
`outline-3` sozinho não). O upstream Nuxt UI v4.10.0 (`theme/banner.ts`) usa
`-outline-offset-3`/`has-[>a:focus-visible]:outline-3` porque o Tailwind v4 mudou essa
escala pra aceitar qualquer número. A classe `outline-[color-mix(...)]` (cor) está correta
e já compila — o problema é só nas duas classes de largura/offset numérico.

Fix confirmado (testado isolado, compila certinho):

  -outline-offset-3                        →  -outline-offset-[3px]
  has-[>a:focus-visible]:outline-3         →  has-[>a:focus-visible]:outline-[3px]

Antes de propor qualquer plano:
1. Leia src/components/element/banner/banner.theme.js — é só a linha do variant `to`
   (dentro de `variants.to.true.root`) que precisa mudar; nada mais no arquivo tem esse
   padrão.
2. Confirme que `banner.component.spec.js` não testa esse variant `to` diretamente (os
   2 testes existentes usam `to` ausente) — a correção não deve quebrar o texto das
   classes já cobertas pelos `expect(root.className).toBe(expected.root)`.
3. Rode `npm run build:css` antes e depois da correção e confira, no
   dist/gravity-elements.css gerado, que `outline-width:3px` e `outline-offset:-3px`
   reais aparecem pras classes corrigidas (não só a presença na safelist).

Proponha um plano do que vai ser alterado (só banner.theme.js deve mudar; sem novos
arquivos) para completar essa correção. Não implemente nada ainda — aguarde minha
aprovação do plano.

Depois de aprovado: implemente, rode `npm run lint`, `npm run build:js`,
`npm run build:css` e `npm test`, e só então atualize a sub-linha de evidência do item
"Componente: Banner" no TODO (seção 12) de specs/spec-etapa-1-layout-element.md, deixando
registrado que houve uma correção pós-revisão (motivo + padrão aplicado, citando também
que é uma causa raiz diferente do bug de opacidade do Alert — escala de outline-width,
não color-mix). Não altere o texto do item nem seu estado `[x]`/`[ ]` — quem marca
conclusão no TickTick sou eu, depois de validar. Não toque em nenhum sistema de gestão de
tarefas fora deste arquivo.
