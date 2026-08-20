Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-2-form.md deste repositório.

Tarefa (copiar exatamente): "Componente: FileUpload (wrapper ng-file-upload)"

**Contexto**: `geCheckbox`, `geCheckboxGroup` e `geColorPicker` estão concluídos e verificados
(marcados `[x]` na seção 12 da spec, cada um com sub-linha(s) de evidência — leia as três antes
de começar). `geColorPicker` é o precedente mais próximo desta tarefa: é o outro wrapper de lib
de terceiros do subgrupo 4 (seção 1), então releia `src/components/form/color-picker/` inteiro
como referência de como integrar uma lib vanilla/módulo Angular externo ao ciclo de vida e ao
`ngModel` customizado deste projeto — mesmo padrão, biblioteca diferente.

**Novidade de processo importante**: a seção 9 da spec foi atualizada nesta sessão — Karma real
(ChromeHeadless de verdade, não mock) **passou a funcionar** no sandbox de verificação usado por
esta sessão Claude/Cowork (achado durante a revisão do ColorPicker). Isso não muda nada do seu
lado — você já roda `npm test` normalmente no seu ambiente — mas significa que a verificação
independente feita depois vai rodar a suíte Karma real e não só ler o código, então **não afirme
um resultado de `npm test` sem ter rodado agora** (regra já vale desde sempre, mas reforçando).

1. **Inspecione o estado atual do repositório** — não assuma nada de sessões anteriores. Rode
   `git status`/`git log -1`, confirme que `src/components/form/color-picker/` existe e está
   completo, e que `src/components/form/file-upload/` ainda não existe. Confirme se
   `ng-file-upload` já está instalado (`package.json`/`node_modules`) — se não estiver, é parte
   desta tarefa instalar com `--save-exact`, registrar a licença (MIT esperado) em
   `THIRD-PARTY-LICENSES.md` e **declarar `ngFileUpload` no array de deps de
   `gravityElements.form`** (`src/components/form/form.module.js` — hoje é `['ngMessages',
   'ngFileUpload']` conforme a seção 2 da spec, mas `ngMessages` só deve ter sido adicionado de
   fato quando `Form`/`FormField` forem implementados; confirme o estado real do array antes de
   mexer, não assuma).

2. Leia a seção 6 da spec (tabela de componentes Form), linha `geFileUpload` — bindings de
   partida: `multiple` (`<`), `accept` (`@`), `maxSize` (`<`), `disabled` (`<`). **Não é um
   contrato fechado** (seção 5.1) — confirme contra a tag `v4.10.0` real
   (`raw.githubusercontent.com/nuxt/ui/v4.10.0/src/theme/file-upload.ts` e o componente Vue
   correspondente, `runtime/components/FileUpload.vue`) antes de implementar, documentando o que
   foi confirmado (props extras, se há distinção de layout single-file vs. multi-file/lista, etc).

3. **`ngModel`**: string documentada na seção 6 — `File` único ou **array de `File`** conforme
   `multiple` (mesma decisão de "tipo do modelo muda com uma prop" já vista no
   `geCheckboxGroup`, mas aqui a alternância é por binding, não por componente separado). Decida
   e documente como o `$formatters`/`$parsers`/`$isEmpty` lidam com essa alternância — provável
   que `$isEmpty` trate `null`/`[]`/`undefined` como vazio nos dois modos.

4. **Integração com `ng-file-upload`** (serviço `Upload` + diretivas `ngf-select`/`ngf-drop`,
   seção 2): use as diretivas da lib no template em vez de reimplementar seleção/drag-and-drop
   nativo — é exatamente o que a lib existe pra resolver. Estado visual de drop ativo via
   `data-is-dragover` (seção 5.11 — não `data-dragover` cru, mesma regra `BOOLEAN_ATTR` já
   aplicada em todo componente anterior) sincronizado com `ngf-drag-over-class` da lib.

5. **Progresso via `<ge-progress>` reutilizado** (Etapa 1, já existe — seção 6 nota do
   `geProgress`: "Barra de progresso do `geFileUpload` durante o upload — não reimplementar barra
   própria"). O upload de verdade (chamada a `Upload.upload(...)`) é responsabilidade de quem
   consome `geFileUpload` (o componente expõe o arquivo via `ngModel`; quem faz o POST real é o
   formulário/serviço do app) **ou** o próprio componente dispara o upload internamente — decidir
   e documentar qual dos dois é o contrato (confira a v4.10.0 real, item 2, pra ver se
   `FileUpload.vue` só seleciona ou também envia; documentar a decisão tomada mesmo que a real
   não faça upload algum, já que Nuxt UI não tem backend).

6. **ARIA** (seção 6, linha `geFileUpload`): zona de drop com `role="button"` (se
   focável/clicável) ou `aria-label` descritivo; `aria-live="polite"` numa região que anuncia
   progresso/conclusão do upload; erros de validação de arquivo (tipo/tamanho, via `accept`/
   `maxSize`) anunciados pela mesma região `aria-live` ou via `ngMessages` se usado dentro de
   `geFormField` (ainda não existe nesta etapa — `geFormField` vem depois, então por enquanto a
   região `aria-live` própria é o caminho). Como aqui não há múltiplos elementos "de grupo" tipo
   `geCheckboxGroup`, mas também não é um único controle simples tipo `geColorPicker` — é uma
   zona de drop + lista de arquivos quando `multiple` — avalie caso a caso onde
   `aria-invalid`/`aria-required` (se houver validação via `ngModel`/`$validators`, ex.
   `maxSize`) devem pousar: no elemento focável real da zona de drop, não em nenhum host não
   focável (mesmo raciocínio da §5.15, mas aqui não é uma "escolha nativa múltipla", é mais perto
   do padrão por-elemento do `geColorPicker`/`geCheckbox`). Verificar por execução real (Karma
   real agora disponível, seção 9 — ou jsdom), não só leitura de código.

7. Casos de teste mínimos (seção 5.9): os 4 do baseline de `ngModel` (render inicial, interação
   do usuário, mudança externa pós-montagem, estado inválido — aqui provavelmente `maxSize`/
   `accept` violado) **mais** os 2 específicos de `FileUpload` exigidos pela spec: (a) seleção de
   arquivo (via input nativo ou `ngf-select`) atualiza `ngModelCtrl` com o(s) arquivo(s); (b)
   progresso simulado (mock do serviço `Upload`) atualiza o `<ge-progress>` interno corretamente.

8. Checklist `ng-attr-data-*`/`BOOLEAN_ATTR` (seção 5.11) e Tailwind v3→v4 (seção 5.10) — mesma
   atenção já aplicada nos três componentes anteriores, incluindo conferir o CSS realmente
   compilado (não só a safelist) para qualquer classe arbitrária nova.

9. Demo (seção 7 da spec / seção "Demo app atualizado a cada tarefa" de
   `processo-implementacao.md`): criar `demo/pages/form/file-upload.html` + entrada em
   `demo/routes.js`, uso básico com `ng-model` + variações (`multiple`, `accept`, `maxSize`,
   `disabled`) e, se o componente disparar upload de verdade, algum mock/endpoint de teste local
   pro progresso ser visível (documentar o que foi usado). Comparação visual pontual com
   `ui.nuxt.com/docs/components/file-upload` (v4.10.0 fixada). **Atenção**: este componente está
   na lista de checkpoint manual do Otávio (seção "Fluxo de trabalho") — drag-and-drop e
   progresso real precisam funcionar de verdade no navegador, não só nos testes; a tarefa não é
   considerada pronta só com evidência do Cursor, o Otávio confirma ao vivo depois.

Verifique que nenhuma mudança quebra o que já existe: `npm run lint` limpo, `npm run build:js`/
`build:css` sem erro, `geFileUpload` registrado em `gravityElements.components` via injector,
CSS compilado realmente contém as classes novas (não só a safelist), e **rode `npm test` de
verdade e cole o resultado real**.

Proponha um plano do que vai ser criado/alterado (arquivos e pastas, incluindo a instalação do
`ng-file-upload` se ainda não estiver presente) para completar essa tarefa. Não implemente nada
ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então marque o item
como "- [x]" no TODO (seção 12) de `specs/spec-etapa-2-form.md`, com uma sub-linha de evidência
do que foi feito (incluindo a rota de demo tocada e as decisões tomadas nos itens 3, 5 e 6 acima).
Não altere o texto do item. Não toque em nenhum sistema de gestão de tarefas fora deste arquivo —
o TickTick é sincronizado exclusivamente pela sessão Claude/Cowork, nunca pelo Cursor. Se
encontrar um bug em revisão independente depois, a correção vai em `bugfix.md` (raiz do repo),
não aqui — este arquivo (`plantask.md`) é só a definição da tarefa.
