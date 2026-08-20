Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-2-form.md deste repositório.

Tarefa (copiar exatamente): "Componente: ColorPicker (wrapper Pickr)"

**Contexto**: `geCheckbox` e `geCheckboxGroup` estão concluídos e verificados (marcados `[x]` na
seção 12 da spec, cada um com sub-linha de evidência — leia as duas antes de começar,
principalmente a nota da §5.15 sobre onde aplicar `aria-invalid`/`aria-required` quando o
`ngModel` fica no host). `ColorPicker` é o primeiro componente do subgrupo 4 (wrapper de
biblioteca de terceiros) desta etapa — muda bastante o padrão em relação aos dois anteriores:
não é HTML nativo estilizado, é uma lib vanilla (Pickr) integrada ao ciclo de vida do Angular.

1. **Inspecione o estado atual do repositório** — não assuma nada de sessões anteriores. Rode
   `git status`/`git log -1`, confirme que `src/components/form/checkbox/` e
   `src/components/form/checkbox-group/` existem e estão completos, e que
   `src/components/form/color-picker/` ainda não existe. Confirme também se `@simonwep/pickr`
   já está instalado (`package.json`/`node_modules`) — se não estiver, é parte desta tarefa
   instalar com `--save-exact`, registrar a licença (MIT esperado) em
   `THIRD-PARTY-LICENSES.md` (seção 2 da spec) e declarar a dependência no módulo certo.

2. Leia a seção 6 da spec (tabela de componentes Form), linha `geColorPicker` — bindings de
   partida: `format` (`@`, `'hex'`|`'rgba'`|`'hsla'`), `swatches` (`<`, array de cores
   predefinidas), `disabled` (`<`). **Não é um contrato fechado** (seção 5.1) — confirme contra
   a tag `v4.10.0` real (`raw.githubusercontent.com/nuxt/ui/v4.10.0/src/theme/color-picker.ts` e
   `ColorPicker.vue`) antes de implementar, incluindo props que a tabela da seção 6 pode não ter
   listado (ex.: `size`, `throttle`).

3. **Decisão de implementação em aberto, resolver e documentar** (seção 6, nota do componente):
   usar o posicionamento próprio do Pickr (ele já embute um popper) em vez de
   `ge-floating-position`, que só entra em produção nesta etapa via
   `Select`/`SelectMenu`/`InputMenu` (seção 2). Ou seja: **não** é necessário integrar
   `ge-floating-position` aqui a menos que, na prática, o posicionamento nativo do Pickr fique
   visualmente inconsistente com o resto da etapa — só trocar se houver um motivo concreto
   observado, documentando a decisão tomada (mantida ou trocada, e por quê).

4. **Ciclo de vida da lib vanilla** (seção 2, mesmo padrão já usado para
   `ge-floating-position`/`ge-focus-trap` sobre Floating UI/`focus-trap` na Etapa 0 — usar esses
   componentes como precedente de implementação, não uma API nova): instanciar o Pickr no
   `$onInit` sobre um elemento trigger do template, **destruir no `$onDestroy`** (`pickr.destroy()`
   — vazamento de listener/DOM órfão é o bug mais provável aqui, e é justamente o primeiro caso
   de teste extra exigido, item 7 abaixo). Confirmar a API de customização visual do Pickr
   (classes/template customizável, tema mínimo `pickr/dist/themes/nano.min.css` ou equivalente)
   antes de implementar — não assumir; documentar o que foi confirmado.

5. **`ngModel` customizado no host** (mesmo padrão §5.3 já aplicado em `geCheckbox`/
   `geCheckboxGroup`): `require: { ngModelCtrl: 'ngModel' }`, `ngModel` = **string** de cor no
   formato de `format` (`hex`/`rgba`/`hsla` — decidir se a conversão de formato é responsabilidade
   do componente ou repassada crua ao Pickr, e documentar). `$render` deve inicializar/atualizar a
   cor selecionada no Pickr a partir do modelo (inclusive em mudança **pós-montagem** do
   consumidor, não só na primeira renderização — caso de teste obrigatório, item 6 abaixo);
   `$parsers`/mudança do usuário no Pickr (evento `change`/`save` da lib, confirmar qual evento é
   o correto antes de escolher) chama `$setViewValue`.

6. **ARIA** (seção 6, linha `geColorPicker`): `aria-label` no trigger (ex.: `"Selecionar cor"` —
   confirmar se há um binding de label mais específico na v4.10.0 real), `aria-haspopup="dialog"`,
   `aria-expanded` refletindo o painel do Pickr aberto/fechado (sincronizar com os eventos
   `show`/`hide` da lib, não assumir que dá pra fazer só com CSS/`ng-class` sem hook no evento
   real). Como aqui não há múltiplos elementos "de grupo" (não é o caso da §5.15 — é um único
   controle de valor), aplica-se o padrão de correção **por-elemento** do `geCheckbox`, não o
   padrão de grupo do `geCheckboxGroup`: `aria-invalid`/`aria-required` devem pousar no elemento
   focável real (o trigger), não em um host não-focável — verificar por execução real (jsdom),
   não só por leitura de código, exatamente como nos dois componentes anteriores.

7. Casos de teste mínimos (seção 5.9): os 4 do baseline de `ngModel` (render inicial, interação
   do usuário, mudança externa pós-montagem, estado inválido) **mais** os 2 específicos de
   `ColorPicker` exigidos pela spec: (a) confirmar que o Pickr é inicializado no `$onInit` e
   **destruído no `$onDestroy`** (mock/spy em `pickr.destroy`, sem vazamento de listener/DOM
   órfão); (b) valor inicial/mudança externa do modelo refletindo corretamente na preview de cor
   do trigger.

8. Checklist `ng-attr-data-*`/`BOOLEAN_ATTR` (seção 5.11) e Tailwind v3→v4 (seção 5.10) — mesma
   atenção já aplicada nos dois componentes anteriores, incluindo conferir o CSS realmente
   compilado (não só a safelist) para qualquer classe arbitrária nova que o tema de `ColorPicker`
   introduzir, e para a sobrescrita do CSS mínimo do Pickr via Tailwind.

9. Demo (seção 7 da spec / seção "Demo app atualizado a cada tarefa" de
   `processo-implementacao.md`, parte da própria definição de pronto): criar
   `demo/pages/form/color-picker.html` + entrada em `demo/routes.js`, uso básico com `ng-model`
   string de cor + 2-3 variações (`format`, `swatches`, `disabled`). Comparação visual pontual com
   `ui.nuxt.com/docs/components/color-picker` (v4.10.0 fixada).

Verifique que nenhuma mudança quebra o que já existe: `npm run lint` limpo, `npm run build:js`/
`build:css` sem erro, `geColorPicker` registrado em `gravityElements.components` via injector,
CSS compilado realmente contém as classes novas (não só a safelist).

Proponha um plano do que vai ser criado/alterado (arquivos e pastas, incluindo a instalação do
Pickr se ainda não estiver presente) para completar essa tarefa. Não implemente nada ainda —
aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então marque o item
como "- [x]" no TODO (seção 12) de `specs/spec-etapa-2-form.md`, com uma sub-linha de evidência
do que foi feito (incluindo a rota de demo tocada e as decisões tomadas nos itens 3, 5 e 6 acima —
posicionamento do Pickr, formato/conversão de cor, e onde ficou o `aria-invalid`/`aria-required`).
Não altere o texto do item. Não toque em nenhum sistema de gestão de tarefas fora deste arquivo —
o TickTick é sincronizado exclusivamente pela sessão Claude/Cowork, nunca pelo Cursor. Essa
marcação/evidência sua é o ponto de partida da verificação independente feita pela sessão
Claude/Cowork depois (que pode confirmar, corrigir ou pedir ajuste antes do TickTick ser
atualizado) — não é a etapa final de aprovação.
