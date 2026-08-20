# Gravity Elements — Spec de Implementação: Etapa 2 (Form)

> Documento autocontido para implementação por agente de codificação (Cursor AI), nos moldes de `spec-etapa-1-layout-element.md`. Referências completas de arquitetura estão em `gravity-elements-especificacao-tecnica.md`; o processo operacional completo (papéis, fluxo Plan→Build→TODO, sincronização com TickTick, **regra de demo por tarefa**) está em `processo-implementacao.md` — este documento extrai e detalha apenas o necessário técnico para a Etapa 2.

## Fluxo de trabalho desta etapa (importante)

Mesmo fluxo das Etapas 0/1, documentado em detalhe em `processo-implementacao.md`. Resumo, mais o que muda a partir desta etapa:

- Este agente **não tem e não deve buscar acesso** ao TickTick. Progresso é reportado exclusivamente marcando os itens do **TODO da seção 11** deste arquivo.
- **Um chat de Plan mode por item do TODO**, não um chat por componente-e-meio nem por categoria inteira. Cada chat começa sem memória do que veio antes — o prompt de abertura (template `plantask.md`) deve sempre incluir o texto exato da tarefa, a referência de seção deste documento, e instrução para inspecionar o repositório atual antes de planejar.
- Marcar `- [x]` só quando implementado **e verificado** (teste rodou e passou, não só "código escrito"). Sub-linha de evidência obrigatória. Não alterar o texto dos itens — espelham string-a-string as tarefas do TickTick.
- **Regra nova a partir desta etapa (ver `processo-implementacao.md`, seção "Demo app atualizado a cada tarefa")**: cada tarefa `Componente: X` só é considerada pronta quando, além dos 4 arquivos do contrato + teste unitário, a rota/página de demo (`demo/routes.js` + `demo/pages/form/<nome>.html`) tiver sido criada/atualizada **e** a comparação visual pontual com `ui.nuxt.com/docs/components/<nome>` tiver sido feita — não existe mais uma tarefa "Demo app" em lote no fim da etapa (diferente da Etapa 1). A evidência da tarefa deve citar a rota tocada.
- Checkpoint manual adicional do Otávio no demo app (mesmo padrão da Etapa 1, seção "Fluxo de trabalho") para os componentes com interação de teclado não trivial, antes de considerar a tarefa concluída mesmo com evidência do Cursor já registrada: **Select, SelectMenu, InputMenu, Listbox** (roving tabindex + floating), **PinInput** (navegação entre caixas + paste), **Slider** (arraste + teclado), **InputDate/InputTime** (navegação do calendário/seletor), **FileUpload** (drag-and-drop + progresso real).

## 1. Objetivo

Implementar os 21 componentes da categoria **Form** do Nuxt UI, com paridade visual e de API, usando a fundação das Etapas 0 (`geTv`, `geId`, `geOverlayStack`, `ge-floating-position`, `ge-focus-trap`, `ge-hotkey`) e 1 (`geButton`, `geIcon`, `geFieldGroup`, `geProgress`, `geChip`, `geKbd`, `geCalendar` — todos reutilizáveis aqui, ver seção 5.7). Esta é a primeira etapa com `ngModel` customizado de verdade — todo componente desta categoria é, ao mesmo tempo, um `.component()` do Angular e um controle de formulário compatível com `ng-model`/`ngMessages`/`FormController` nativos.

Por que Form é mais difícil que Layout+Element (Etapa 1): não é mais majoritariamente `geTv` + template estático. Cada componente precisa implementar corretamente o contrato de `ngModelController` (`$render`, `$setViewValue`, `$formatters`, `$parsers`, `$validators` quando aplicável) para funcionar como qualquer input nativo do Angular dentro de um `<form>`/`ngMessages`. Quatro subgrupos, por complexidade crescente:

1. **Inputs simples de valor único** (texto/número/data/hora) — `Input`, `Textarea`, `InputNumber`, `InputDate`, `InputTime`, `InputRating`, `PinInput`, `InputTags`, `Slider`.
2. **Escolha nativa** (aproveitam semântica/teclado nativo do navegador) — `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Switch`.
3. **Floating + roving tabindex** (a parte mais nova de infraestrutura desta etapa) — `Select`, `SelectMenu`, `InputMenu`, `Listbox`.
4. **Wrappers sobre biblioteca de terceiros** — `ColorPicker` (Pickr), `FileUpload` (ng-file-upload).

Mais os componentes de orquestração de formulário — `Form`, `FormField` — que não são inputs em si, mas o wrapper de validação/label/erro que todos os outros usam.

## 2. Stack e dependências desta etapa

Dependências novas de comportamento (bundle publicado, não devDependency — diferente da Etapa 1, cujo `angular-route` era só para o demo):

| Pacote | Uso | Módulo Angular que declara a dependência |
|---|---|---|
| `angular-messages` (`ngMessages`) | Agregação/exibição de erros de validação em `geForm`/`geFormField` (decisão da seção 13 do plano de etapas) | `gravityElements.form` (não `gravityElements.core` — só componentes de Form usam; segue a convenção de módulo-por-feature da seção 3 da especificação técnica, diferente de `ngAria`/`ngAnimate`, que são de uso transversal e por isso ficaram em `core` desde a Etapa 0) |
| `ng-file-upload` (módulo `ngFileUpload`, expõe o serviço `Upload` + diretivas `ngf-select`/`ngf-drop`) | `geFileUpload` — drag-and-drop, progresso e validação de arquivo prontos | `gravityElements.form` |
| `@simonwep/pickr` (Pickr) | `geColorPicker` — color picker headless o suficiente para restilizar | Não é módulo Angular (lib vanilla) — importado direto no controller do componente, instanciado/destruído no `$onInit`/`$onDestroy`, mesmo padrão já usado para `ge-floating-position`/`ge-focus-trap` sobre Floating UI/focus-trap na Etapa 0. |

Fixar todas as versões exatas (`--save-exact`) — mesma convenção da Etapa 0/1 para as libs `angular-*` (`angular-messages@1.8.3`, mesma major/minor do `angular.js` já instalado) e registrar licença de cada uma em `THIRD-PARTY-LICENSES.md` (MIT esperado para as três; confirmar antes de publicar, seção 11 da especificação técnica).

`gravityElements.form` (novo módulo desta etapa, seguindo o padrão já usado por `gravityElements.layout`/`gravityElements.element` na Etapa 1) declara `['ngMessages', 'ngFileUpload']` — não `ngAria`/`ngAnimate` de novo (já herdados via `gravityElements.core`, que `gravityElements.components` agrega).

Dependências **já instaladas em etapas anteriores, com primeiro uso real de produção nesta etapa**:

- **`tabbable`** (Etapa 0, wrapper ainda não usado em produção até agora) — primeiro uso real: roving tabindex nos painéis de `Select`/`SelectMenu`/`InputMenu`/`Listbox` (mesma lib, mesmo padrão já estabelecido pelo grid de dias do `geCalendar` na Etapa 1 — usar esse componente como precedente de implementação, não uma API nova).
- **`ge-floating-position`** (Etapa 0, wrapper sobre Floating UI, ainda não usado em produção — a nota "fora de escopo" da Etapa 1 dizia respeito só àquela etapa, não a um bloqueio geral) — primeiro uso real: painel flutuante de `Select`/`SelectMenu`/`InputMenu` (trigger + painel posicionado). `Listbox` **não** usa `ge-floating-position` (ver seção 6, nota do componente) — é a variante inline/sempre-visível, não um popover.
- **`ge-hotkey`** (Etapa 0, wrapper sobre Mousetrap) — primeiro uso real: ESC fecha o painel de `Select`/`SelectMenu`/`InputMenu` e devolve o foco ao trigger (reaproveitar em vez de reescrever `ng-keydown` cru, mesma filosofia da seção 7 da especificação técnica).
- **`date-fns`** (Etapa 0, já usado no `geCalendar` da Etapa 1) — reutilizar para `InputDate` (que embute o próprio `<ge-calendar>` num painel flutuante — ver seção 6) e `InputTime`.

## 3. Estrutura de pastas a criar

```
gravity-elements/
├── src/
│   ├── components/
│   │   ├── form/
│   │   │   ├── checkbox/
│   │   │   │   ├── checkbox.component.js
│   │   │   │   ├── checkbox.html
│   │   │   │   ├── checkbox.theme.js
│   │   │   │   └── checkbox.component.spec.js
│   │   │   ├── checkbox-group/        (mesmos 4 arquivos, padrão <feature>.<tipo>.js)
│   │   │   ├── color-picker/
│   │   │   ├── file-upload/
│   │   │   ├── form/
│   │   │   ├── form-field/
│   │   │   ├── input/
│   │   │   ├── input-date/
│   │   │   ├── input-menu/
│   │   │   ├── input-number/
│   │   │   ├── input-rating/
│   │   │   ├── input-tags/
│   │   │   ├── input-time/
│   │   │   ├── listbox/
│   │   │   ├── pin-input/
│   │   │   ├── radio-group/
│   │   │   ├── select/
│   │   │   ├── select-menu/
│   │   │   ├── slider/
│   │   │   ├── switch/
│   │   │   ├── textarea/
│   │   │   └── form.module.js         # angular.module('gravityElements.form', ['ngMessages', 'ngFileUpload'])
│   │   └── components.module.js       # passa a agregar layout.module + element.module + form.module
│   └── gravity-elements.module.js
├── demo/
│   ├── routes.js                      # +21 entradas (form/<nome>)
│   └── pages/
│       └── form/<nome>.html           # 1 página por componente Form
```

Nome de pasta = kebab-case do componente (`checkbox-group/`, `color-picker/`, `input-date/` etc.), nome de arquivo = `<feature>.<tipo>.js` (Y070), elemento HTML = `ge-checkbox-group` etc.

`src/index.js` passa a importar `form.module.js` e cada `*.component.js`/`*.theme.js` desta etapa, mais `angular-messages` e `ng-file-upload` como imports de pacote (para que `window.twMerge`-like wiring, se algum desses pacotes precisar de algo em `window`, seja feito no mesmo lugar — confirmar caso a caso, mesmo cuidado já documentado na Etapa 1 para `tailwind-merge`).

## 4. Convenções obrigatórias (recap da Etapa 0/1, seção 4 da especificação técnica)

Aplicar em todo arquivo criado nesta etapa, sem exceção — mesma lista da Etapa 1 (Y001/Y010, `controllerAs: 'vm'`, Y024, Y021–Y023, prefixo `ge`, `bindings` documentados via JSDoc). Um item novo, específico desta etapa:

- Todo componente de valor único (todos exceto `geForm`/`geFormField`, que não são inputs) declara `require: { ngModelCtrl: 'ngModel' }` (sintaxe de objeto, disponível desde Angular 1.5, preferível a `require: '^ngModel'` porque nomeia a propriedade no controller sem precisar de `$onInit` manual de atribuição) — ver padrão completo na seção 5.3.

## 5. Contrato de componente (recap + extensões desta etapa)

Todo componente desta etapa tem, no mínimo, os 4 arquivos do contrato (`*.component.js`, `*.html`, `*.theme.js`, `*.component.spec.js`) — mesma regra da Etapa 1, seção 5. `geForm` e `geFormField` seguem a mesma exceção documentada na Etapa 1 (§5) se, ao confirmar contra a tag `v4.10.0`, não tiverem `theme/<nome>.ts` próprio (confirmar antes de assumir — não copiar a exceção do `geApp` sem checar).

### 5.1 Referência de design — versão fixada (recap)

Mesma referência da Etapa 1: **Nuxt UI `v4.10.0`** (`github.com/nuxt/ui`). Mesmo aviso já registrado no status atual: a doc ao vivo (`ui.nuxt.com`) pode divergir da tag pinada — sempre confirmar contra o tarball do npm (`registry.npmjs.org/@nuxt/ui/-/ui-4.10.0.tgz`) e a tag do GitHub antes de reportar uma "divergência" como bug. Cabeçalho de atribuição obrigatório em todo `*.theme.js` portado, igual à Etapa 1.

**As tabelas da seção 6 abaixo listam bindings principais como ponto de partida, não um contrato fechado** — mesma cláusula já estabelecida na Etapa 1, §5.4.2: confirmar contra o `theme/<nome>.ts` e o `.vue` reais da tag antes de implementar, incluir bindings/slots adicionais quando existirem, e registrar na evidência do TODO o que foi adicionado além da tabela e por quê. Isso é ainda mais importante nesta etapa, pois vários componentes (`InputMenu`, `SelectMenu`, `PinInput`, `InputTags`) têm superfícies de API maiores que qualquer componente da Etapa 1.

### 5.2 Padrão de bindings (recap + `ngModel`)

Mesma convenção da Etapa 1 (`@` para props visuais/enum, `<` para valores/objetos/booleans, `&` para callbacks) **mais**: todo componente de valor único usa o próprio elemento customizado como alvo de `ng-model` do consumidor (`<ge-input ng-model="vm.email">`, não um binding próprio tipo `value`/`modelValue`) — isso é o que dá compatibilidade real com `FormController`/`ngMessages`/`$error` nativos, ao contrário de um binding `<` que exigiria `$onChanges` manual e não participaria de `form.$valid`/`form.$dirty`. Diferente do Nuxt UI original (que usa `v-model`/`modelValue` porque é a convenção do Vue), aqui a escolha de usar `ng-model` nativo é deliberada e mais alinhada ao ecossistema AngularJS/John Papa do que replicar um binding `modelValue`/`onUpdate:modelValue` — mesma decisão já tomada para `ngMessages` em vez de schema (seção 13 do plano de etapas).

### 5.3 Padrão `ngModel` customizado (obrigatório para todo componente de valor único)

Algoritmo padrão, a aplicar em todo componente desta seção salvo nota em contrário na tabela da seção 6:

1. `require: { ngModelCtrl: 'ngModel' }` no objeto do `.component()`.
2. No `$onInit` do controller, configurar o `ngModelCtrl` recebido via `this.ngModelCtrl` (injetado automaticamente pelo Angular por causa do `require` de objeto — não precisa buscar via `element.controller('ngModel')`):
   - `vm.ngModelCtrl.$render = renderValue;` — função que lê `vm.ngModelCtrl.$viewValue` e atualiza o DOM/estado interno do componente (ex.: valor exibido no `<input>` interno, dia selecionado no calendário embutido, opção marcada na lista).
   - `vm.ngModelCtrl.$formatters.push(formatModelToView);` — quando o valor do modelo do consumidor muda por fora (ex.: `vm.email = 'x@y.com'` no controller pai), converte para o formato interno que o componente exibe (geralmente identidade para `Input`/`Textarea`; conversão de tipo para `InputNumber` — number para string de exibição — e `InputDate`/`InputTime` — Date para string formatada via `date-fns`).
   - `vm.ngModelCtrl.$parsers.push(parseViewToModel);` — na direção contrária, quando o usuário interage (digita, seleciona, arrasta), converte o valor de view para o tipo que deve ir pro modelo do consumidor (string → number, string → Date, seleção única → valor do item, seleção múltipla → array).
   - Interação do usuário chama `vm.ngModelCtrl.$setViewValue(novoValor)` seguido de `vm.ngModelCtrl.$render()` seguido de `vm.ngModelCtrl.$commitViewValue()` **ou** simplesmente `$setViewValue` (que já agenda commit no próximo `$digest` conforme `updateOn`, padrão `'default'` — não mudar `ng-model-options` a menos que a tabela da seção 6 diga o contrário, ex.: `debounce` em `Input` de busca).
3. `$validators` customizados (`vm.ngModelCtrl.$validators.<nome> = fn`) só quando o componente tem uma noção própria de validade que não é um simples `ng-required`/`ng-pattern` aplicado pelo consumidor — ex.: `InputTags` com `maxTags`, `PinInput` com `length` incompleto, `Slider` com valor fora de `min`/`max` quando escrito programaticamente. Documentar cada `$validators` custom na tabela ARIA/teste da seção 6/5.9, já que cada um vira uma chave nova disponível em `ng-messages` (`vm.ngModelCtrl.$error.<nome>`).
4. **Herdado do `ngAria`** (Etapa 0, já em `gravityElements.core`): `aria-invalid`, `aria-required` são aplicados automaticamente quando o componente usa `ng-required`/o próprio `ngModelCtrl.$invalid` — não escrever isso manualmente, só confirmar que o elemento certo (o host custom-element ou o `<input>` interno, a depender de onde o foco realmente pousa) recebe o atributo. Ver nota de host vs. elemento interno na seção 5.14 (mesmo achado já documentado na Etapa 1 para `FieldGroup`/`Skeleton`).

Exemplo mínimo de referência (`input.component.js`, simplificado — a versão real leva tema/ícones/etc. conforme a tabela da seção 6):

```js
(function () {
  'use strict';

  angular.module('gravityElements.form').component('geInput', {
    templateUrl: 'components/form/input/input.html',
    controllerAs: 'vm',
    require: { ngModelCtrl: 'ngModel' },
    bindings: {
      type: '@',           // 'text' | 'email' | 'password' | 'url' | 'search' | 'tel' | 'number'
      placeholder: '@',
      icon: '@',
      leadingIcon: '@',
      trailingIcon: '@',
      size: '@',
      color: '@',
      variant: '@',
      disabled: '<',
      loading: '<'
    },
    controller: InputController
  });

  InputController.$inject = ['geTv', 'geInputTheme', 'geId'];

  function InputController(geTv, geInputTheme, geId) {
    var vm = this;
    vm.$onInit = onInit;
    vm.onInput = onInput;

    function onInit() {
      vm.id = geId.next('input');
      vm.classes = geTv(geInputTheme)({
        size: vm.size || 'md',
        color: vm.color || 'primary',
        variant: vm.variant || 'outline',
        disabled: vm.disabled
      });
      vm.ngModelCtrl.$render = renderValue;
      vm.ngModelCtrl.$formatters.push(identity);
      vm.ngModelCtrl.$parsers.push(identity);
    }

    function renderValue() {
      vm.viewValue = vm.ngModelCtrl.$viewValue;
    }

    function onInput(newValue) {
      vm.ngModelCtrl.$setViewValue(newValue);
    }

    function identity(value) {
      return value;
    }
  }
})();
```

O template (`input.html`) tem um `<input>` nativo interno com `ng-model="vm.viewValue"` **e** `ng-change="vm.onInput(vm.viewValue)"` — ou, mais simples e menos propenso a loop de digest, `ng-model-options="{ getterSetter: false }"` com um `ng-input`/listener direto — decisão de implementação do Cursor, documentar a escolhida (mesmo espírito da seção 5.4.2 da Etapa 1: liberdade de implementação, obrigação de documentar).

### 5.4 Padrão `ngMessages` em `geForm`/`geFormField`

Decisão confirmada na seção 13 do plano de etapas: **sem** schema (zod/valibot/yup) — usar `ngMessages` (módulo oficial) direto sobre o `$error` do `ngModelCtrl`/`FormController` nativo.

- **`geForm`**: wrapper fino em torno de `<form name="{{ vm.name }}" novalidate>` (ou `<ng-form>` quando aninhado dentro de outro form) — `novalidate` desabilita a UI de validação nativa do navegador, deixando toda a exibição de erro a cargo de `ngMessages`/`geFormField`. Bindings: `name` (`@`, nome do form, necessário para os filhos acharem o `FormController` via `^^form` sem depender só da hierarquia de escopo), `disabled` (`<`, propaga estado desabilitado para os campos — decisão de implementação: `$broadcast`/controller pai lido pelos filhos via `require: '^^geForm'`, documentar a escolhida), `onSubmit` (`&`, só dispara se `formCtrl.$valid`). Transclusion simples do conteúdo do formulário.
- **`geFormField`**: `require: { formCtrl: '^^form' }` (funciona com qualquer form ancestral, nativo ou `geForm` — o `FormController` do Angular é o mesmo independente de quem declarou o `<form>`/`<ng-form>`) + binding `name` (`@`, deve bater com o `name` do `ng-model` do input transcluído). Template: label (com `for`/`aria-describedby` via `geId`), `ng-transclude` do input real, hint/descrição opcional, e um bloco `<div ng-messages="vm.formCtrl[vm.name].$error" ng-if="vm.formCtrl[vm.name].$dirty || vm.formCtrl.$submitted">` com `ng-message` para cada chave comum (`required`, `minlength`, `maxlength`, `pattern`, `email`, mais qualquer `$validators` customizado documentado na seção 5.3) — mensagens padrão em português, mas com binding `messages` (`<`, objeto opcional) para o consumidor sobrescrever texto por chave. Bindings: `label` (`@`), `name` (`@`), `hint`/`description` (`@`), `required` (`<`, só decorativo — o asterisco/indicador visual; a obrigatoriedade real continua sendo `ng-required` no input, `geFormField` não implementa validação, só exibição, conforme a decisão da seção 13), `messages` (`<`, opcional).
- **Associação de acessibilidade**: `geFormField` gera o `id` (via `geId`) e injeta `aria-describedby` apontando pro bloco de erro/hint no input transcluído — como o input real está *dentro* do slot transcluído (não é filho direto do controller do `FormField`), a forma mais robusta é o próprio componente de input (`geInput` etc.) aceitar um binding opcional `describedBy`/ler um atributo do elemento pai mais próximo com `role="group"` — **decisão de implementação em aberto para o Cursor**: escolher entre (a) `geFormField` passa `aria-describedby` via `$transclude` + manipulação de atributo do primeiro elemento filho encontrado, ou (b) cada input de valor único aceita um binding `ariaDescribedby` (`@`) que o `geFormField` preenche via interpolação no `ng-transclude`, documentando a escolha e testando que o atributo aparece de fato no DOM do input real (não só no wrapper).

### 5.5 Transclusion (recap)

Mesma regra da Etapa 1 (`transclude: true` ou multi-slot `?elementName`). `geFormField` usa transclusion simples (um input real dentro). `geForm` idem (conteúdo livre do formulário inteiro).

### 5.6 Ícones — `geIcon` já existe (mudança importante em relação à Etapa 1)

Diferente da Etapa 1, onde vários componentes usavam `icon` antes de `geIcon` existir (workaround documentado na §5.4/§5.4.1 daquela spec), **`geIcon` já está pronto** desde a Etapa 1 — todo componente desta etapa que precisa de ícone (`Input` leading/trailing, `InputRating` estrelas, `InputMenu`/`SelectMenu` chevron, `ColorPicker` swatch, etc.) usa `<ge-icon>` diretamente, sem stub nem comentário de "trocar depois".

### 5.7 Sub-componentes da Etapa 1 já prontos para reuso — usar antes de reescrever

Mesma filosofia da seção 7 da especificação técnica ("antes de escrever qualquer lógica de comportamento nova, verificar se algo já resolve o problema"), aplicada agora a componentes próprios já prontos, não só libs de terceiros:

| Componente da Etapa 1 | Onde reutilizar nesta etapa |
|---|---|
| `geButton` | Botões de incremento/decremento do `InputNumber`; botão de confirmar/limpar do `ColorPicker`; botão de submit de exemplo no formulário do critério de aceite (seção 8). |
| `geIcon` | Ver seção 5.6 — qualquer ícone desta etapa. |
| `geFieldGroup` | Agrupamento visual de `Input` + `geButton` colados (ex.: campo de busca com botão), já que `geFieldGroup` foi implementado na Etapa 1 justamente para isso. |
| `geProgress` | Barra de progresso do `geFileUpload` durante o upload — não reimplementar barra própria. |
| `geChip` | Renderização de cada tag em `InputTags` (chip removível) — confirmar contra `theme/input-tags.ts` da v4.10.0 se o upstream realmente reusa o slot de `Chip` internamente antes de decidir; se não reusar, documentar por que `geChip` não se aplica. |
| `geKbd` | Dica visual de atalho de teclado em `SelectMenu`/`InputMenu` (ex.: "↑↓ para navegar, Enter para selecionar"), se o upstream mostrar isso — conferir. |
| `geCalendar` | `InputDate` embute `<ge-calendar>` dentro do painel flutuante — não recriar grid de dias. |

### 5.8 ARIA por componente (mínimo obrigatório)

`ngAria` cobre `aria-disabled`/`aria-required`/`aria-invalid` automaticamente via `ng-disabled`/`ng-required`/`ngModelCtrl.$invalid`. Abaixo, só o que precisa de atributo manual no template:

| Componente | ARIA mínimo |
|---|---|
| `geCheckbox` | `role` nativo do `<input type="checkbox">` já é suficiente; `aria-checked` automático via propriedade nativa `checked` — só adicionar `aria-describedby` quando usado dentro de `geFormField` (seção 5.4). |
| `geCheckboxGroup` | `role="group"` no fieldset visual, `aria-label`/`aria-labelledby` apontando pro legend/label do grupo. |
| `geColorPicker` | `aria-label` no trigger (ex. `"Selecionar cor"`), `aria-haspopup="dialog"`, `aria-expanded` refletindo o painel do Pickr aberto/fechado. |
| `geFileUpload` | Zona de drop com `role="button"` (se focável/clicável) ou `aria-label` descritivo; `aria-live="polite"` numa região que anuncia progresso/conclusão do upload; erros de validação de arquivo (tipo/tamanho) anunciados via a mesma região `aria-live` ou via `ngMessages` se usado dentro de `geFormField`. |
| `geForm` | Sem requisito próprio além do `<form>` nativo. |
| `geFormField` | `<label for="...">` associado ao `id` do input real (via `geId` + a resolução da seção 5.4); bloco de erro com `role="alert"` **ou** `aria-live="polite"` (decidir qual — `alert` é mais assertivo/interruptivo, adequado a erro de submit; `polite` para validação incremental durante digitação — documentar a escolha, pode ser condicional). |
| `geInputDate` / `geInputTime` | Trigger com `aria-haspopup="dialog"`, `aria-expanded`; painel com `role="dialog"` ou `role="application"` conforme decisão do `geCalendar` já tomada na Etapa 1 (reaproveitar). |
| `geInputMenu` / `geSelectMenu` | Padrão ARIA de combobox: `role="combobox"` no input/trigger, `aria-expanded`, `aria-controls` apontando pro `id` do painel, `aria-autocomplete="list"`; itens da lista com `role="option"`, `aria-selected`. |
| `geInputRating` | `role="radiogroup"` ou `role="slider"` (decidir conforme a interação real — se são "estrelas clicáveis discretas", `radiogroup` com um `radio` por valor é mais correto que `slider`; documentar a escolha) + `aria-valuenow`/`aria-valuemax` se optar por `slider`. |
| `geInputTags` | `role="list"` na lista de tags, cada tag com `aria-label` incluindo o botão de remover (`"Remover tag: <valor>"`). |
| `geListbox` | `role="listbox"` no container, `role="option"` + `aria-selected` em cada item, `aria-multiselectable` quando `multiple`. |
| `gePinInput` | Cada caixa é um `<input>` nativo com `aria-label` posicional (ex. `"Dígito 3 de 6"`), `inputmode="numeric"` quando `type="number"`. |
| `geRadioGroup` | `role="radiogroup"` no fieldset visual, `aria-label`/`aria-labelledby`; cada `<input type="radio">` já é nativamente acessível. |
| `geSelect` | Mesmo padrão combobox de `geSelectMenu` quando o trigger for um botão que abre lista (`role="combobox"` ou `aria-haspopup="listbox"` + `role="button"`, a depender de ser pesquisável ou não — `Select` não é pesquisável, então `aria-haspopup="listbox"` no trigger é mais correto que `role="combobox"`; documentar). |
| `geSlider` | `role="slider"` (nativo se usar `<input type="range">`, senão manual), `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, `aria-orientation` se vertical. |
| `geSwitch` | `role="switch"` explícito (não é o role padrão de `<input type="checkbox">`), `aria-checked` refletindo o estado. |
| `geTextarea` | Sem requisito além de `ngAria` automático. |

### 5.9 Casos de teste mínimos por subgrupo

Baseline geral (herdado da Etapa 1, §5.6): pelo menos 2 casos por componente (`defaultVariants` + 1 override de prop relevante). Para componentes com `ngModel` customizado, **substituir** esse baseline pelo mínimo abaixo (mais específico e mais importante que só variantes visuais):

- **Todo componente de valor único** (subgrupos 1–3 da seção 1): mínimo 4 casos — (a) `$render` reflete corretamente um valor inicial vindo do modelo do consumidor; (b) interação do usuário chama `$setViewValue` com o valor certo e atualiza o modelo do consumidor (`scope.$digest()` + assert no valor do `ng-model` externo); (c) mudança do modelo do consumidor **depois** da montagem inicial (`scope.valor = novo; scope.$digest();`) reflete no componente via `$formatters`/`$render` (caso pós-montagem, já exigido de forma geral pela Etapa 1 §5.6, mas aqui é o caso central do componente, não um extra); (d) pelo menos 1 caso de estado inválido (`ng-required`/`ng-pattern`/`$validators` customizado) confirmando que `ngModelCtrl.$invalid`/`$error.<chave>` fica correto.
- **`geCheckboxGroup`/`geRadioGroup`/`geListbox` (multi-seleção)**: + 1 caso de seleção múltipla/desmarcação confirmando que o array do modelo reflete exatamente os itens marcados, na ordem esperada (ou ordem de exibição, decidir e documentar).
- **`geSelect`/`geSelectMenu`/`geInputMenu` (subgrupo 3, floating + roving tabindex)**: mínimo 6 casos — os 4 do baseline de `ngModel` acima, mais navegação por seta (foco move item a item dentro do painel aberto), `Home`/`End` (primeiro/último item), `Enter`/`Espaço` seleciona o item focado, `Esc` fecha o painel e devolve foco ao trigger (mesmo padrão de teste do `geCalendar` na Etapa 1, seção 5.6, adaptado de dias-do-mês para itens-da-lista).
- **`gePinInput`**: + 2 casos — navegação entre caixas (`digitar` avança, `Backspace` numa caixa vazia volta e limpa a anterior), colar (`paste`) um valor com N caracteres distribui um por caixa.
- **`geSlider`**: + 2 casos — arraste/clique define o valor mais próximo do passo (`step`) permitido; navegação por seta (`ArrowUp`/`ArrowRight` incrementa, `ArrowDown`/`ArrowLeft` decrementa, respeitando `min`/`max`/`step`).
- **`geColorPicker`**: + 1 caso confirmando que o Pickr é inicializado no `$onInit` e destruído no `$onDestroy` (evitar vazamento de listener/DOM órfão — checar `pickr.destroy` chamado), mais 1 caso de valor inicial/mudança externa refletindo na preview de cor.
- **`geFileUpload`**: + 2 casos — seleção de arquivo (via input nativo ou `ngf-select`) atualiza `ngModelCtrl` com o(s) arquivo(s); progresso simulado (mock do serviço `Upload`) atualiza `geProgress` interno corretamente.
- **`geForm`**: mínimo 3 casos — `onSubmit` só dispara quando `formCtrl.$valid`; `disabled: true` propaga para os campos filhos (ou documentar limitação, mesmo padrão da ressalva do `geAvatarGroup` na Etapa 1 §5.9 se a propagação não for reativa); `novalidate` presente no `<form>` renderizado.
- **`geFormField`**: mínimo 3 casos — mensagem de erro aparece quando `$dirty`/`$submitted` e `$invalid`; mensagem some quando o campo fica válido; `label`/`for`/`aria-describedby` corretos no DOM.

**Verificação de CSS compilado e checklist Tailwind v3/v4 seguem obrigatórios** (mesma seção 5.6/5.7 da Etapa 1, sem mudança de regra) — ver recap na seção 5.10 abaixo.

### 5.10 Checklist Tailwind v3→v4 (recap obrigatório da Etapa 1, seção 5.7)

Os três padrões já confirmados na Etapa 1 continuam valendo e são ainda mais prováveis de aparecer aqui, já que os temas de Form do Nuxt UI usam bastante `ring`/`outline` em estados de foco/erro:

1. **Opacidade sobre `var()`** (`bg-primary/10` etc.) → escrever `color-mix()` por extenso.
2. **`ring-N`/`outline-N` fora da escala 0/1/2/4/8 do v3** → `ring` sem sufixo = 3px do v4; demais casos, valor arbitrário em colchetes. **Atenção especial nesta etapa**: estados de foco (`focus-visible:ring-2`) e de erro (`ring-error` em inputs inválidos) são extremamente comuns em componentes de Form — checar cada um.
3. **Variantes `not-*`** → reescrever como seletor arbitrário ou aceitar como inerte (documentar).

Antes de portar qualquer `compoundVariants`/`variants` de qualquer um dos 21 componentes, checar contra esses três padrões — não assumir que compila só porque `npm run build:css` sai com exit 0 (mesmo aviso da Etapa 1: o Tailwind descarta classe não reconhecida silenciosamente).

### 5.11 `ng-attr-data-*` × `BOOLEAN_ATTR` (recap obrigatório da Etapa 1, seção 5.10)

Achado da Etapa 1 (Calendar): `ng-attr-data-<palavra>` nunca resolve se a última palavra colidir com `multiple`/`selected`/`checked`/`disabled`/`readOnly`/`required`/`open` **e** o elemento for `input`/`select`/`option`/`textarea`/`button`/`form`/`details`. **Extremamente relevante nesta etapa** — praticamente todo componente de Form vai querer `data-checked`, `data-disabled`, `data-invalid`, `data-required`, `data-selected` em elementos `<input>`/`<button>` para estilização condicional via seletor de atributo do Tailwind (`data-[checked]:...`). Usar desde já os nomes seguros já confirmados na Etapa 1 (`data-is-checked`, `data-is-disabled`, `data-is-invalid`, `data-is-required`, `data-is-selected`) em vez de descobrir o bug de novo — não é uma checklist "testar cada vez", é know-how já pago: **usar o prefixo `is-` para qualquer `data-*` desses cinco nomes desde a primeira implementação**, em qualquer componente desta etapa.

### 5.12 Nota `ngAnimate` (recap da Etapa 1, seção 5.8)

Relevante para o painel flutuante de `Select`/`SelectMenu`/`InputMenu` (abre/fecha com `ng-if`), o thumb do `Slider` (se usar `ng-class` para estado de arraste) e qualquer transição de `geFormField` ao mostrar/esconder a mensagem de erro. Mesma orientação da Etapa 1: preferir asserir contra o valor computado pelo controller em testes pós-montagem, não contra `element.className` do DOM; usar poll com múltiplos `$digest()` quando o teste precisar mesmo do DOM real.

### 5.13 Padrão floating + roving tabindex (`Select`/`SelectMenu`/`InputMenu`/`Listbox`)

Infraestrutura nova desta etapa, primeiro uso real de `ge-floating-position` + `tabbable` combinados (o `geCalendar` da Etapa 1 usou só `tabbable`, sem popover). Padrão comum aos três componentes com trigger+painel (`Select`, `SelectMenu`, `InputMenu`):

1. Trigger (`<button>` ou `<input>`, a depender do componente — `Select`/`SelectMenu` usam botão, `InputMenu` usa input de texto) com `ge-floating-position` apontando pro painel (`placement="bottom-start"`, mesma API já definida na Etapa 0 pra essa diretiva — não reabrir decisão de API, só consumir).
2. Painel (`ng-if`/`ng-show` controlado por `vm.open`) contém a lista de itens; ao abrir, foco vai para o item selecionado (ou o primeiro, se nenhum) via `tabbable`/`focus()` manual.
3. Roving tabindex dentro do painel: só o item "ativo" tem `tabindex="0"`, os demais `tabindex="-1"` (padrão do `geCalendar`, reaproveitar a mesma lógica de índice ativo); `ArrowDown`/`ArrowUp` movem o índice ativo (usar `tabbable(panelElement)` para obter a lista de itens focáveis, não hardcode de seletor).
4. `ge-hotkey` (Etapa 0) faz o `Esc` fechar o painel e devolver foco ao trigger — não escrever handler de teclado próprio para isso.
5. **Decisão de composição recomendada**: `Select`/`SelectMenu`/`InputMenu` reutilizam `<ge-listbox>` **dentro** do painel flutuante para a lista em si (item + seleção + roving tabindex), em vez de duplicar a lógica de lista três vezes — `Listbox` já é, por natureza, "a lista sem popover"; o popover é só a casca de posicionamento por cima. Isso é análogo ao próprio Reka UI/Nuxt UI original, que compõe `Popover` + `Listbox` internamente para `SelectMenu`. Se, ao confirmar contra a v4.10.0, a composição real for diferente (ex.: `SelectMenu` não reusa `Listbox` internamente), documentar a divergência e a razão na evidência do TODO em vez de forçar a composição.
6. `Listbox` em si (sem popover) é sempre renderizado inline — não usa `ge-floating-position`. Mesma lógica de roving tabindex do item 3, sem os itens 1/2/4 (não há trigger nem painel para posicionar/fechar).

### 5.14 Nota: host custom-element × stretch (recap da Etapa 1)

Mesmo achado da Etapa 1 (`geSkeleton`, `geButton`/`geBadge` dentro de `geFieldGroup`): o host de um custom element AngularJS não herda automaticamente tamanho/stretch do elemento interno. Atenção redobrada nesta etapa para qualquer input dentro de `geFieldGroup`/grid (ex.: `Input` + `geButton` colados) — confirmar visualmente que o host (`<ge-input>`) estica tanto quanto o `<input>` interno, não só o `<input>` sozinho.

### 5.15 Nota: `aria-invalid`/`aria-required` do `ngAria` aplicam no host, não no elemento focável real (achado no `geCheckbox`, 2026-08-20)

Mesma classe de bug da seção 5.14 (host × elemento interno), agora em estado ARIA em vez de layout. `ngAria` aplica `aria-invalid`/`aria-required`/`aria-disabled` automaticamente no elemento que carrega a diretiva `ngModel`/`ng-required`/`ng-disabled` — que, no padrão desta etapa (seção 5.2), é sempre o **host** custom-element (`<ge-input ng-model="...">`, `<ge-checkbox ng-model="...">` etc.), não o `<input>`/`<textarea>`/elemento nativo focável interno. O host não é focável — quem recebe foco de teclado e é o que um leitor de tela realmente anuncia é o elemento interno. Confirmado reproduzível em `geCheckbox`: com o campo obrigatório e inválido, o host ficava corretamente `aria-invalid="true" aria-required="true"`, mas o `<input>` real continuava `aria-invalid="false"`/sem `aria-required` — um usuário de leitor de tela nunca ouvia o estado real do campo.

**Aplicação por tipo de componente** (não é uma correção única a copiar igual em todo lugar — a semântica muda conforme o componente):

- **Componentes de valor único com um elemento interno focável óbvio** (`Input`, `Textarea`, `InputNumber`, `InputDate`, `InputTime`, `InputRating`, `PinInput` por caixa, `Slider`, `Switch`) — mesma correção do `geCheckbox`: interpolar `aria-invalid` (gate em `$invalid && $dirty`, para não anunciar "inválido" em campo pristine) e `aria-required` (via presença de `vm.ngModelCtrl.$validators.required`, cobrindo tanto um binding `required` próprio quanto `ng-required` aplicado direto pelo consumidor) no elemento focável interno, não só confiar no que `ngAria` aplica automaticamente no host.
- **Componentes com múltiplos elementos focáveis internos representando UM valor de grupo** (`CheckboxGroup`, `RadioGroup`, `Listbox`, `Select`/`SelectMenu`/`InputMenu` com painel de itens) — a invalidez pertence ao **grupo**, não a um item individual; não faz sentido replicar `aria-invalid` em cada `<input>`/item da lista. Aplicar no elemento que tem `role="group"`/`role="radiogroup"`/`role="listbox"` (ou equivalente da seção 5.8), não em cada opção. Avaliar em cada tarefa qual é o "elemento real" certo para essa semântica — documentar a decisão tomada.
- **`FormField`** (§5.4) deve ser o mecanismo preferencial de associação de erro (via `aria-describedby` apontando pro bloco de `ngMessages`) quando o componente estiver dentro dele — a correção de `aria-invalid`/`aria-required` no elemento interno dos itens acima continua necessária mesmo assim, pois um consumidor pode usar o componente fora de `FormField` (só com `ng-model`/`ng-required` nativos) e ainda assim precisa de ARIA correto.

Checklist obrigatório a partir de `CheckboxGroup`: para todo componente com `require: 'ngModel'` no host, checar (via execução real, não só leitura de código) se `aria-invalid`/`aria-required` acabam pousando só no host ou também no(s) elemento(s) focável(is) real(is) — e corrigir antes de considerar a tarefa pronta, não depois.

## 6. Componentes — Form (21)

Ordem de implementação **igual à ordem de criação das tarefas no TickTick**, que por sua vez já bate com a ordem alfabética da navegação de `ui.nuxt.com/docs/components` (confirmado nesta sessão via fetch da página) — decisão do Otávio, sem reordenar por dependência técnica. Uma consequência dessa ordem, documentada explicitamente para não ser um "bug" descoberto tarde: `Form`/`FormField` (tarefas 5–6) vêm **antes** de `Input` (tarefa 7) — ver nota de exceção na seção 10.

| Componente | Bindings principais | Notas |
|---|---|---|
| `geCheckbox` | `label` (`@`), `description` (`@`), `color` (`@`), `size` (`@`), `variant` (`@`, `'list'`\|`'card'`), `indeterminate` (`<`), `disabled` (`<`), `required` (`<`) | `<input type="checkbox">` nativo interno; `ng-model` no host segue o padrão da seção 5.3, mas o `$formatters`/`$parsers` aqui é praticamente identidade (boolean↔boolean) — o valor real é sincronizar `$render` com a propriedade `checked` do `<input>` interno. ARIA/checklist: seções 5.8/5.11. |
| `geCheckboxGroup` | `options` (`<`, array de `{ value, label, description, disabled }` ou array de strings), `orientation` (`@`), `color`/`size`/`variant` (`@`, propagam pros itens) | `ng-model` = array de valores selecionados; renderiza um `<input type="checkbox">` nativo por opção. Caso de teste extra: seleção múltipla (seção 5.9). ARIA: seção 5.8. |
| `geColorPicker` | `format` (`@`, `'hex'`\|`'rgba'`\|`'hsla'`), `swatches` (`<`, array de cores predefinidas), `disabled` (`<`) | Wrapper sobre **Pickr** (`@simonwep/pickr`) — instanciado no `$onInit` sobre um elemento trigger, destruído no `$onDestroy`. `ng-model` = string de cor no formato de `format`. **Decisão de implementação em aberto**: usar o posicionamento próprio do Pickr (mais simples, o Pickr já tem popper embutido) em vez de `ge-floating-position` — documentar se essa escolha foi mantida ou se `ge-floating-position` acabou sendo necessário para consistência visual com o resto da etapa. Tema Pickr: partir do CSS mínimo (`pickr/dist/themes/nano.min.css` ou equivalente) e sobrescrever extensivamente via Tailwind — confirmar a API de customização do Pickr (classes/template customizável) antes de implementar, não assumir. Caso de teste extra: init/destroy do Pickr (seção 5.9). |
| `geFileUpload` | `multiple` (`<`), `accept` (`@`), `maxSize` (`<`), `disabled` (`<`) | Wrapper sobre **ng-file-upload** (`Upload` service + `ngf-select`/`ngf-drop`). `ng-model` = `File` único ou array de `File` conforme `multiple`. Reutiliza `<ge-progress>` (Etapa 1) para a barra de progresso — não reimplementar. Zona de drop com estado visual `data-is-dragover` (seção 5.11) durante `ngf-drag-over-class`. ARIA: seção 5.8. Casos de teste extra: seleção de arquivo + progresso mockado (seção 5.9). |
| `geForm` | `name` (`@`), `disabled` (`<`), `onSubmit` (`&`) | Ver padrão completo na seção 5.4. `<form novalidate>`/`<ng-form>` interno + transclusion simples. Sem `ngModel` próprio (não é um input). |
| `geFormField` | `label` (`@`), `name` (`@`), `hint`/`description` (`@`), `required` (`<`, decorativo), `messages` (`<`, opcional) | Ver padrão completo na seção 5.4 — o componente mais novo/arquiteturalmente importante da etapa, todos os outros inputs são tipicamente usados dentro dele. **Nota de sequência**: como vem antes de `Input` no TODO, a primeira versão da página de demo usa um `<input>` nativo temporário dentro do `<ge-form-field>` (mesmo padrão de stub do `geButton` antes do `geIcon` na Etapa 1, §5.4.1) — trocar pelo `<ge-input>` real assim que a tarefa `Componente: Input` for concluída (2 tarefas depois), documentando a troca na evidência daquela tarefa, não desta. |
| `geInput` | `type` (`@`), `placeholder` (`@`), `icon`/`leadingIcon`/`trailingIcon` (`@`), `size` (`@`), `color` (`@`), `variant` (`@`), `disabled` (`<`), `loading` (`<`) | Exemplo de referência completo na seção 5.3 — implementar literalmente esse contrato (mais o que a tabela real de `theme/input.ts` v4.10.0 tiver além disso). ARIA: automático via `ngAria` + seção 5.8. |
| `geInputDate` | `minDate`/`maxDate` (`<`), `locale` (`@`), `format` (`@`, string de formatação `date-fns`) | Trigger (input de texto formatado) + painel flutuante (`ge-floating-position`) embutindo `<ge-calendar>` (Etapa 1) — não recriar grid de dias. `ng-model` = `Date`. `$formatters`/`$parsers` fazem `Date` ↔ string formatada via `date-fns format`/`parse`. ARIA: seção 5.8. |
| `geInputMenu` | `options` (`<`), `placeholder` (`@`), `creatable` (`<`, permite valor livre não presente em `options`), `multiple` (`<`) | Combobox pesquisável — trigger é o próprio `<input>` de texto (filtra `options` conforme digitação), painel flutuante com `<ge-listbox>` (ver seção 5.13). `ng-model` = valor único ou array conforme `multiple`. ARIA/teste: seções 5.8/5.9. |
| `geInputNumber` | `min`/`max`/`step` (`<`), `formatOptions` (`<`, opcional — `Intl.NumberFormat`), `disabled` (`<`) | Botões de incremento/decremento reusando `<ge-button>` (seção 5.7). `ng-model` = `Number`; `$parsers` faz `parseFloat`/clamp em `min`/`max`, `$formatters` faz `Number.prototype.toString` (ou `Intl.NumberFormat` se `formatOptions`). |
| `geInputRating` | `max` (`<`, número de ícones, default 5), `icon` (`@`), `readonly` (`<`), `disabled` (`<`) | `ng-model` = `Number`. Navegação por seta ajusta valor ±1. **Decisão de implementação em aberto**: `role="radiogroup"` (um "radio" implícito por ícone) vs. `role="slider"` — decidir e documentar (seção 5.8). Usa `<ge-icon>` pros ícones/estrelas. |
| `geInputTags` | `options` (`<`, opcional — autocomplete), `maxTags` (`<`), `delimiter` (`@`, ex. vírgula/Enter separam tags) | `ng-model` = array de strings. Renderiza cada tag via `<ge-chip>` (seção 5.7, confirmar reuso real contra a v4.10.0) com botão de remover. `$validators.maxTags` se `maxTags` definido (vira chave em `ngMessages`). ARIA: seção 5.8. |
| `geInputTime` | `minTime`/`maxTime` (`<`), `step` (`<`, granularidade em minutos), `format` (`@`, 12h/24h) | **Decisão registrada**: não usar `<input type="time">` nativo (widget não estilizável, inconsistente entre navegadores, quebraria paridade visual com `ui.nuxt.com`) — construir custom com par de seletores numéricos hora/minuto (mesmo padrão de stepper do `InputNumber`) ou reaproveitar o painel do `InputDate` adaptado, decisão do Cursor, documentar. `ng-model` = `Date` (só a porção hora/minuto relevante) ou string `"HH:mm"` — decidir e documentar; `date-fns` para formatação. |
| `geListbox` | `options` (`<`), `multiple` (`<`), `orientation` (`@`) | Ver padrão completo na seção 5.13 — variante inline, sem popover. `ng-model` = valor único ou array. Reutilizado internamente por `Select`/`SelectMenu`/`InputMenu` (composição recomendada, seção 5.13, item 5). |
| `gePinInput` | `length` (`<`, número de caixas, default 5), `type` (`@`, `'text'`\|`'number'`), `mask` (`<`, exibe `•` em vez do valor), `otp` (`<`, habilita paste-splitting) | `ng-model` = string concatenada (ou array de caracteres — decidir e documentar). N `<input>` nativos de 1 caractere cada, navegação entre caixas + paste (seção 5.9). ARIA: seção 5.8. |
| `geRadioGroup` | `options` (`<`), `orientation` (`@`), `color`/`size`/`variant` (`@`, `'list'`\|`'card'`) | `<input type="radio">` nativo, mesmo `name` (gerado via `geId`) para todo o grupo — navegação por seta já é comportamento nativo do navegador, **sem** roving tabindex customizado (decisão já confirmada no plano de etapas). `ng-model` = valor único. ARIA/checklist: seções 5.8/5.11. |
| `geSelect` | `options` (`<`), `placeholder` (`@`), `icon` (`@`) | Dropdown simples, **não pesquisável** (diferença chave para `SelectMenu` — confirmar essa distinção contra a doc real da v4.10.0 antes de implementar, não assumir só pela semelhança de nome). Trigger = botão. Painel flutuante com `<ge-listbox>` (seção 5.13). `ng-model` = valor único. ARIA: `aria-haspopup="listbox"` no trigger (seção 5.8, distinto do padrão combobox do `SelectMenu`/`InputMenu`). |
| `geSelectMenu` | `options` (`<`), `searchable` (`<`), `multiple` (`<`), `creatable` (`<`) | Combobox rico — pesquisável, multi-seleção com chips (reusar `<ge-chip>`, seção 5.7), criação de item novo. Trigger = botão ou input, a depender de `searchable`. Painel flutuante com `<ge-listbox>` (seção 5.13). `ng-model` = valor único ou array. ARIA: padrão combobox (seção 5.8). |
| `geSlider` | `min`/`max`/`step` (`<`), `range` (`<`, habilita dois thumbs), `orientation` (`@`) | **Decisão registrada**: thumb único envolve `<input type="range">` nativo restilizado (`::-webkit-slider-thumb`/`::-moz-range-thumb` via Tailwind arbitrary/plugin) em vez de reimplementar arraste com JS — reaproveita a interação nativa de teclado/mouse/touch do navegador. Modo `range` (dois thumbs) usa dois `<input type="range">` sobrepostos com `pointer-events`/`z-index` (técnica CSS conhecida), **não** física de arraste customizada. `ng-model` = `Number` (thumb único) ou `[Number, Number]` (`range`). Casos de teste extra: seção 5.9. |
| `geSwitch` | `label` (`@`), `color` (`@`), `size` (`@`), `disabled` (`<`) | `<input type="checkbox" role="switch">` nativo interno — visualmente um toggle, semanticamente um switch (`role="switch"` explícito, seção 5.8, diferente do `role` implícito de `geCheckbox`). `ng-model` = boolean. |
| `geTextarea` | `placeholder` (`@`), `rows` (`<`), `autoresize` (`<`, cresce com o conteúdo via `scrollHeight`), `size`/`color`/`variant` (`@`), `disabled` (`<`) | Mesmo padrão de `geInput` (seção 5.3), elemento interno `<textarea>` em vez de `<input>`. `autoresize`: ajustar `style.height` a partir de `scrollHeight` no `ng-change`/`$watch` do view value — técnica simples, não precisa de lib. |

## 7. Demo app: 1 rota por componente (aditivo a cada tarefa, não em lote)

Mesmo shell do demo já existente desde a Etapa 0/1 (`ngRoute`, `demo/index.html`, navegação lateral) — não reconstruir. A cada tarefa `Componente: X` desta etapa (seção 5, regra nova do processo):

- Adicionar a entrada em `demo/routes.js`: `$routeProvider.when('/form/<nome>', { templateUrl: 'demo/pages/form/<nome>.html' })`.
- Criar/atualizar `demo/pages/form/<nome>.html` com pelo menos: uso básico com `ng-model` ligado a uma variável do escopo do demo, 2–3 variações de props relevantes, e — a partir de `FormField` existir — pelo menos um exemplo do componente dentro de `<ge-form-field>` mostrando validação (`ng-required`, `ng-pattern` etc.) com mensagem de erro visível.
- Comparação visual pontual com `ui.nuxt.com/docs/components/<nome>` (v4.10.0 fixada, mesmo aviso da seção 5.1 sobre a doc ao vivo divergir).
- A evidência do TODO (seção 11) cita a rota tocada.

## 8. Critérios de aceite (verificar e relatar todos)

1. Cada um dos 21 componentes: os arquivos do contrato completos (seção 5 — 4 arquivos, salvo exceção documentada tipo `geApp` na Etapa 1), teste unitário Karma passando com o mínimo de casos aplicável (seção 5.9), ARIA mínimo aplicado (seção 5.8), `eslint .` limpo, rota de demo + comparação visual feitas como parte da própria tarefa (seção 7).
2. `src/index.js` atualizado para importar `form.module.js`, `angular-messages`, `ng-file-upload` e cada `*.component.js`/`*.theme.js` desta etapa; `npm run build:js` continua gerando `dist/gravity-elements.umd.js` sem erro, com os 21 componentes registrados em `gravityElements.components` (mesma verificação via injector já feita nas etapas anteriores).
3. `npm run build:css` gera `dist/gravity-elements.css` sem erro **e** a safelist captura as classes de todos os `*.theme.js` novos — mesma ressalva da Etapa 1: build sem erro não é o mesmo que CSS correto (seção 5.10 desta spec / 5.7 da Etapa 1).
4. Demo app com as 21 rotas novas navegáveis (`npm run demo`), sem erro no console do navegador — total acumulado de rotas: 24 (Etapa 1) + 21 (Etapa 2) = 45.
5. `npm test` (Karma) continua passando 100%, incluindo toda a suíte herdada das Etapas 0/1 (nenhuma regressão) — reportar contagem final de testes.
6. `ngModel` customizado funcionando ponta a ponta em todo componente de valor único: valor inicial, interação do usuário, mudança externa pós-montagem, e estado inválido corretamente refletido em `$error` (seção 5.9).
7. [Critério de aceite] **Formulário de exemplo (login + cadastro) no demo app** usando 100% dos 21 componentes desta etapa — página dedicada (`demo/pages/form/exemplo-completo.html` ou nome equivalente), rota própria, não substitui as 21 rotas individuais.
8. [Critério de aceite] **Validação via `ngMessages` funcionando** no formulário de exemplo — mensagens por regra (`required`, `minlength`, `pattern`, mais pelo menos 1 `$validators` customizado de algum componente da tabela da seção 6) visíveis e corretas.
9. [Critério de aceite] **Upload de arquivo com progresso funcional via `ng-file-upload`** — no formulário de exemplo ou numa rota dedicada de `geFileUpload`, progresso real (não só mockado em teste) confirmado ao vivo no navegador do usuário (`claude-in-chrome`), já que Karma não roda neste sandbox (ver seção 9).

## 9. Verificação (limitação de ambiente revista nesta etapa — Karma real passou a funcionar)

**Atualização (Claude/Cowork, 2026-08-20, durante a revisão do ColorPicker)**: a limitação "Karma/ChromeHeadless não roda neste sandbox Cowork", documentada desde a Etapa 0 e repetida sem mudança até aqui, **não é mais verdade** para o container de nuvem desta sessão (`x86_64`, não ARM64 como se supunha antes) — ele tem um binário real de Chromium pré-instalado via Playwright (`/opt/pw-browsers/chromium-*/chrome-linux/chrome`). `npm run bundle:tv-shim` + `npx karma start test/karma.conf.js --single-run` com um launcher customizado (`base: 'ChromeHeadless'`, `flags: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']`) e `CHROME_BIN` apontando pra esse binário roda a suíte real (confirmado nesta sessão: **152/152 SUCCESS**, todos os componentes de Form até `ColorPicker`, em ~1.4s). Passo a passo: copiar `src/`, `test/`, `package.json`/`package-lock.json` e configs (sem `node_modules`/`dist`) pro container, `npm install` (rede liberada pro registro npm), depois o comando acima com um `test/karma.*.conf.js` que estende `test/karma.conf.js` só trocando `browsers`/`customLaunchers` (não precisa alterar o `test/karma.conf.js` real do repo).

**Isso passa a ser o método de verificação preferencial desta sessão a partir de agora** (mais forte que jsdom — é a suíte real, sem reimplementar os casos à mão) para qualquer componente **sem** interação de ponteiro/teclado complexa demais pra simular via `dispatchEvent`/`triggerHandler` (que é a maioria — inclusive `ColorPicker`, cujo clique em swatch do painel do Pickr já é testado assim no próprio spec oficial). jsdom continua útil como muleta rápida quando só se quer checar 1–2 casos sem montar o ambiente Karma completo. **Não elimina** o checkpoint manual do Otávio via `claude-in-chrome` para os componentes de interação não trivial listados na seção "Fluxo de trabalho" (Select/SelectMenu/InputMenu/Listbox roving-tabindex+floating, PinInput paste, Slider arraste, InputDate/InputTime navegação de calendário, FileUpload drag-and-drop) — Karma real prova que os *casos de teste escritos* passam, não substitui a observação humana de UX ao vivo nesses casos específicos.

## 10. Fora de escopo desta etapa

Componentes de Data, Navigation, Overlay, Dashboard (Etapas 3–6). Qualquer uso de `ge-focus-trap` (Overlay, Etapa 4 — nenhum painel desta etapa precisa de focus trap completo, só fechar com Esc/devolver foco ao trigger, que é `ge-hotkey` + `.focus()` manual, não focus trap). Sistema de schema de validação (zod/valibot/yup) — decisão confirmada contra, seção 13 do plano de etapas.

**Exceção documentada de sequência (não é "fora de escopo", é ordem aceita)**: `geFormField` (tarefa 6) precede `geInput` (tarefa 7) no TODO — resultado da decisão de manter a ordem alfabética/TickTick em vez de reordenar por dependência técnica (alinhado nesta sessão, 2026-08-20). Consequência aceita: a primeira versão da demo de `geFormField` usa um `<input>` nativo temporário (mesmo padrão de stub do `geButton`/`geIcon` na Etapa 1, §5.4.1), trocado pelo `<ge-input>` real 1 tarefa depois. Como o próprio `ngModel`/`FormController` nativo do Angular não depende de `geForm`/`geFormField` existirem (`ngModel` é nativo do framework, não uma peça que os componentes Gravity fornecem), nenhum outro componente desta etapa fica bloqueado por essa ordem — só a demo do `FormField` em si tem uma janela curta de stub.

## 11. Sobre o mapeamento com o TickTick

O TODO da seção 12 é um espelho exato (mesmo texto) das 24 tarefas do projeto "Etapa 2 - Form" no TickTick (grupo "Gravity Elements", id `6a6519558f08070d6bfd7e38`), confirmado nesta sessão: 21 tarefas `Componente: <Nome>` (algumas já com anotação própria no título, ex. "ColorPicker (wrapper Pickr)", "RadioGroup (input nativo)" — preservar o texto exato) mais os 3 critérios de aceite finais (itens 7–9 da seção 8). A ordem das tarefas no TickTick já é a ordem de implementação escolhida (alfabética/`ui.nuxt.com`, seção 6) — **nenhuma reordenação foi necessária**. Cada tarefa `Componente: X` só deve ser marcada `[x]` quando os 4 arquivos existirem, o teste unitário passar com o mínimo de casos exigido (seção 5.9), o `eslint .` estiver limpo, **e** a rota/página de demo + comparação visual estiverem feitas (seção 7, regra nova do processo) — não basta o `.component.js` existir.

## 12. TODO (espelho das tarefas do TickTick — marcar aqui, não no TickTick)

- [x] Componente: Checkbox
  - Evidência: criados `src/components/form/checkbox/` com 4 arquivos do contrato (`checkbox.component.js`, `checkbox.html`, `checkbox.theme.js`, `checkbox.component.spec.js`) e `src/components/form/form.module.js` (primeiro módulo de Form, só wiring — sem `ngMessages`/`ngFileUpload` ainda, adicionados quando `Form`/`FileUpload` forem implementados); `components.module.js`/`src/index.js`/`test/karma.conf.js` atualizados. Tema portado de `theme/checkbox.ts` v4.10.0 (slots root/container/base/indicator/icon/wrapper/label/description, variants color×7/variant list-card/indicator/size/required/disabled/highlight/checked, compounds card×size/card×color/highlight×color). `ngModel` customizado no host (`require: 'ngModel'`, `$isEmpty` customizado, `$render`/`$formatters`/`$parsers`), `indeterminate` tratado como propriedade nativa do `<input>` (não é estado do modelo). Checklist Tailwind v3→v4 (§5.10): `color-mix()` nas cores de outline, `focus-visible:outline-[3px]`, `size-[1.125rem]` (não `size-4.5`) — confirmados via build isolado do Tailwind CLI, CSS gerado contém as declarações reais, não só a safelist. Checklist `ng-attr-data-*`/`BOOLEAN_ATTR` (§5.11): `data-is-checked`/`data-is-disabled`/`data-is-indeterminate` no `<label>` e no `<input>`. 11 casos de teste (9 originais + 2 da correção de ARIA abaixo). Demo: rota `#/form/checkbox`, nav "Form", ícones `i-lucide-check`/`i-lucide-minus` adicionados a `demo-icons.css`; comparação visual com `ui.nuxt.com/docs/components/checkbox` sem divergência (Usage/Color/Variant list-card/Size/Disabled/Indeterminate/Required). `npm run lint` exit 0; `npm run build:js`/`build:css` sem erro.
  - **Correção de bug real encontrada em revisão independente (Claude/Cowork, 2026-08-20)**: `ngAria` aplicava `aria-invalid`/`aria-required` no host `<ge-checkbox>` (onde está o `ng-model` do consumidor), não no `<input type="checkbox">` interno — o host não é focável, então um leitor de tela navegando pelo campo real nunca ouvia "inválido"/"obrigatório", mesmo com o campo genuinamente assim. Confirmado por execução real (bundle UMD + AngularJS real via `jsdom`, não só leitura de código): com `required="true"` (ou `ng-required="true"` direto do consumidor) e desmarcado, o host ficava corretamente `aria-invalid="true" aria-required="true"`, mas o `<input>` ficava `aria-invalid="false"`/sem `aria-required`. Corrigido interpolando `aria-invalid` (gate em `$invalid && $dirty`, para não anunciar "inválido" em campo pristine — mesmo raciocínio do §5.4) e `ng-attr-aria-required` (via presença de `$validators.required`, cobrindo tanto o binding `required` quanto `ng-required`) diretamente no `<input>` interno. 2 casos de teste novos cobrindo pristine vs. dirty e os dois caminhos (`required`/`ng-required`). Reverificado de forma independente após a correção: rebuild (`npm run lint`/`build:js` limpos) + 17 execuções reais via `jsdom`+AngularJS (11 casos do spec oficial reproduzidos manualmente + regressão dos 9 originais), todas passando, incluindo o gate pristine/dirty e ambos os caminhos de `required`. Sem mudança de tema/CSS/visual (fix é só ARIA/atributo) — demo não precisou de nova comparação visual.
- [x] Componente: CheckboxGroup
  - Implementação (Cursor): criados `src/components/form/checkbox-group/` com 4 arquivos do contrato (`checkbox-group.component.js`, `checkbox-group.html`, `checkbox-group.theme.js`, `checkbox-group.component.spec.js`). Tema portado de `theme/checkbox-group.ts` v4.10.0 (slots root/fieldset/legend/item, variants orientation/color/variant list-card-table/size/required/disabled, compounds table×size/table×orientation/table×color/table×disabled). Confirmado contra CheckboxGroup.vue v4.10.0: o upstream reusa `UCheckbox` internamente; Gravity **não** aninha `<ge-checkbox>` (ngModel boolean registraria N controles no FormController pai, e o geCheckbox aplica `aria-invalid` por input — §5.15). Markup de item reusa `geTv(geCheckboxTheme)` (variant `table` do grupo cai em `list` no checkbox; o chrome de tabela fica no slot `item`). Binding da lista: `options` (tabela §6; upstream chama `items`). Extras da v4.10.0 além da tabela: `legend`, `disabled`, `required`, `highlight`, `indicator`, `icon`, `describedBy`, `variant: 'table'`. Omitidos: `as`/`loop`/`defaultValue`/`valueKey`/`labelKey`/`descriptionKey`/`ui`. `ngModel` array no host (`require: 'ngModel'`); `$formatters`/`$parsers` normalizam não-array → `[]` (não identidade pura); `$isEmpty` trata `[]` como vazio. Ordem do modelo: ordem de exibição de `options`, não ordem de marcação. ARIA (§5.15): `aria-invalid`/`aria-required` no `<fieldset role="group">`, não nos `<input>` das opções — `legend` gera `aria-labelledby`. Demo: rota `#/form/checkbox-group`, nav "Form".
  - Verificação independente (Claude/Cowork, 2026-08-20 — regra da seção "Sincronização com o TickTick" de `processo-implementacao.md`): revisão de código completa de `checkbox-group.component.js`/`.theme.js`/`.component.spec.js` confirmando o padrão acima e a aplicação correta da §5.15 em nível de grupo (não replicou o padrão por-item do `geCheckbox`). `npm run lint` exit 0; `npm run build:js`/`build:css` sem erro; safelist Tailwind cresceu para as novas classes do tema. Build isolado do Tailwind CLI confirmou CSS real compilado (não só safelist) para as classes arbitrárias do variant `table`: `color-mix(in srgb,var(--ui-primary) 10%,transparent)` (fundo marcado), `1.125rem` (padding/tamanho), `first-of-type` (arredondamento por orientação), `is-checked` (22 ocorrências). Execução real via `jsdom` + AngularJS real (bundle UMD, mesma mitigação de sandbox do §9, Karma/Chrome indisponível neste ambiente): 28/28 asserções passando, cobrindo render inicial multi-item, interação do usuário com ordem de exibição preservada em seleção múltipla (não ordem de clique), mudança externa de modelo pós-montagem, `ng-required` inválido↔válido, ARIA de grupo no `<fieldset>` — ausente nos `<input>` individuais — com gate pristine/dirty para os dois caminhos (`required` binding e `ng-required` direto), `defaultVariants` batendo com `geTv`, `data-is-checked`/`data-is-disabled` sem colisão com `BOOLEAN_ATTR` e `disabled` nativo refletido, opção individual desabilitada não reagindo a clique, e `options` como array de strings simples (não só objetos). Nenhum bug encontrado — evidência original do Cursor confirmada; substituído apenas o número de casos "Karma" relatado por essa sessão (não executável neste sandbox, §9) pelos 28/28 confirmados por execução real via `jsdom`.
- [x] Componente: ColorPicker (wrapper Pickr)
  - Evidência: criados `src/components/form/color-picker/` com 4 arquivos do contrato (`color-picker.component.js`, `color-picker.html`, `color-picker.theme.js`, `color-picker.component.spec.js`). Instalado `@simonwep/pickr@1.10.1` (`--save-exact`, MIT confirmado no package.json da lib) e registrado em `THIRD-PARTY-LICENSES.md`; wiring vanilla igual `date-fns`/`focus-trap` — `import Pickr` em `src/index.js` → `window.Pickr`, UMD no Karma, **não** entra no array de `gravityElements.form`. Confirmado contra ColorPicker.vue / `theme/color-picker.ts` v4.10.0: o upstream é picker HSV **inline** (`format` hex|rgb|hsl|cmyk|lab, `size`, `throttle`, `disabled`, `defaultValue`; sem swatches, sem trigger). Superfície Gravity = **trigger + painel Pickr** (exemplo “As a color chooser” da doc, não o inline). Extras da v4.10.0 além da tabela §6: `size` (xs–xl no trigger/chip, não no quadrado HSV), `throttle` (default 50). Gravity: `ariaLabel`, `describedBy`, `required`. Omitidos: `as`, `defaultValue` (modelo vazio → preview `#FFFFFF` sem `$setViewValue` no init), `ui`/`class`, formatos `cmyk`/`lab`. Tema: slots `root`/`trigger`/`preview` (não porta `selector`/`track` — DOM do Pickr); nano.min.css importado em `gravity-elements.css` + override `.ge-color-picker-app` com tokens `--ui-*`. Checklist §5.10: `color-mix()`, `outline-[3px]`; §5.11: `data-is-disabled`/`data-is-invalid` no `<button>`. CSS compilado contém `.pcr-app`/`.pcr-button`/`data-theme=nano` e as classes do tema (`p-1.5`, `size-3.5`, `outline-[3px]`, `data-is-disabled`), não só a safelist. **Decisão 3 (posicionamento)**: Nanopop nativo do Pickr (`position: 'bottom-start'`, `useAsButton: true`, painel em `body`) — **não** `ge-floating-position`. **Decisão 5 (formato)**: conversão no componente (Pickr HSVa → `toHEXA`/`toRGBA`/`toHSLA().toString()`); evento `change` (live, sliders/swatches) + `save` (applyColor); `comparison: false` / `interaction.save: false` — §5.7 geButton confirmar/limpar não se aplica. **Decisão 6 (ARIA)**: `aria-invalid`/`aria-required` no `<button>` trigger (padrão por-elemento do geCheckbox, §5.15), não só no host; `aria-haspopup="dialog"`, `aria-expanded` via `show`/`hide`; `aria-label` default `"Selecionar cor"` (Vue v4.10.0 não tem binding de label). 13 casos Karma. Demo: rota `#/form/color-picker`. `npm run lint` exit 0; `npm run build:js`/`build:css` sem erro; `npm test` → 152/152 SUCCESS (reconfirmado após a correção de teste abaixo; a execução real anterior a essa correção era 150/152).
  - **Correção de teste (não de comportamento do componente) encontrada em revisão independente (Claude/Cowork, 2026-08-20)**: `npm test` real (Karma + ChromeHeadless) falhava em 2 dos 13 casos do `color-picker.component.spec.js` — `interação do usuário (change do Pickr) chama $setViewValue e atualiza o modelo` (`Expected '#000000' to be '#ff0000'`) e `format rgba converte a string do modelo a partir do change do Pickr` (`Expected 'rgba(0, 0, 0, 1)' to match /255/`). O helper `simulatePickrChange` buscava `.pcr-app.ge-color-picker-app .pcr-swatches button` em `document` inteiro; cada `Pickr.create()` anexa o painel em `document.body` e `hide()` não o remove, então `buttons[buttons.length - 1]` podia clicar o swatch de outro painel residual. Corrigido escopando à instância sob teste via `vm.pickr.getRoot().app.querySelectorAll('.pcr-swatches button')` (`getRoot()` devolve `this._root`; `.app` é o `.pcr-app` daquela instância). Sem mudança em `.component.js`/`.theme.js`/`.html`/demo. Reverificado: `npm test` → TOTAL: 152 SUCCESS.
  - **Reverificação independente nova sessão (Claude/Cowork, 2026-08-20)**: com o Karma real passando a funcionar neste sandbox (ver seção 9), reexecutei `npm test` do zero (container limpo, `npm install` via rede, sem reaproveitar nenhum resultado anterior) → **TOTAL: 152 SUCCESS**, confirmando a correção acima. Também `npm run lint` (exit 0, sem erros no repo), `npm run build:js`/`build:css` (sem erro; safelist 674 classes/25 temas), e grep no CSS compilado confirmando as classes reais do tema (`color-mix(in srgb,var(--ui-bg-inverted)...)`, `outline-width:3px`, `.ge-color-picker-preview{background-image:...}` do checkerboard de transparência) e do Pickr (`.pcr-app`/`.pcr-button`). Confirmado por leitura direta da fonte real da v4.10.0 (`theme/color-picker.ts` + `runtime/components/ColorPicker.vue`, via fetch): upstream não tem `swatches` (não existe essa prop) e usa `format: hex|rgb|hsl|cmyk|lab` sem alpha — `swatches` e o alfa em `rgba`/`hsla` são extensões da superfície Gravity (trigger+painel Pickr), consistente com a decisão já documentada acima de não portar o picker HSV inline; vale só deixar mais explícito no docblock do componente que `swatches`/`rgba`/`hsla` são adições Gravity, não 1:1 com a prop `format` do upstream (nota cosmética, não bloqueia o fechamento da tarefa). Nenhum bug de comportamento encontrado. Demo (`#/form/color-picker`) conferida contra print do Otávio: 5 seções (Uso básico/Format/Swatches/Size/Disabled) batem com `demo/pages/form/color-picker.html`; preview com checkerboard aparecendo corretamente atrás de cor com alfa < 1 (ex. `#61361873`), sólido quando alfa = 1 — comportamento esperado, sem divergência.
- [ ] Componente: FileUpload (wrapper ng-file-upload)
- [ ] Componente: Form (integração ngMessages)
- [ ] Componente: FormField (wrapper visual + ng-messages)
- [ ] Componente: Input
- [ ] Componente: InputDate
- [ ] Componente: InputMenu
- [ ] Componente: InputNumber
- [ ] Componente: InputRating
- [ ] Componente: InputTags
- [ ] Componente: InputTime
- [ ] Componente: Listbox
- [ ] Componente: PinInput
- [ ] Componente: RadioGroup (input nativo)
- [ ] Componente: Select
- [ ] Componente: SelectMenu
- [ ] Componente: Slider
- [ ] Componente: Switch
- [ ] Componente: Textarea
- [ ] [Critério de aceite] Formulário de exemplo (login + cadastro) no demo app
- [ ] [Critério de aceite] Validação via ngMessages funcionando (required, minlength, pattern)
- [ ] [Critério de aceite] Upload de arquivo com progresso via ng-file-upload
