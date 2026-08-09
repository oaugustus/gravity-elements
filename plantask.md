Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Demo app: 1 rota por componente desta etapa"

Todos os 24 componentes da Etapa 1 já estão implementados e verificados (Layout: App,
Container, Error, Footer, Header, Main, Sidebar, Theme; Element: Alert, Avatar,
AvatarGroup, Badge, Banner, Button, Calendar, Card, Chip, Collapsible, FieldGroup,
Icon, Kbd, Progress, Separator, Skeleton). Esta é a penúltima tarefa da seção 12,
antes só dos 2 critérios de aceite finais (comparação visual e navegação por teclado
do Calendar).

Antes de propor qualquer plano:
1. Leia a seção 8 ("Demo app: 1 rota por componente") por completo:
   - Adotar `ngRoute` (módulo oficial do AngularJS, mesma escolha "oficial primeiro"
     já usada pra `ngAria`/`ngAnimate`/`ngMessages` nas etapas anteriores) só no
     `demo/`, como devDependency: `npm install angular-route@1.8.3 --save-exact
     --save-dev`.
   - `demo/routes.js`: `$routeProvider.when('/layout/app', { templateUrl:
     'demo/pages/layout/app.html' })` etc., **uma entrada por componente (24
     rotas)**, `otherwise` redirecionando pra primeira.
   - Uma página HTML por componente em `demo/pages/<categoria>/<nome>.html`
     (categoria = `layout` ou `element`, batendo com a estrutura de
     `src/components/<categoria>/<nome>/`), com pelo menos: uso básico e 2-3
     variações de props relevantes visíveis lado a lado (facilita a comparação
     visual do critério de aceite 6 — próxima tarefa depois desta).
   - `demo/index.html` ganha `ng-view` + navegação lateral simples (lista de links
     pras 24 rotas; pode usar o próprio `geSidebar` já implementado — dogfooding,
     não obrigatório).
   - **Aditivo** ao demo existente da Etapa 0 (`demo/app.js`, `demo/smoke-tooltip.*`)
     — não remover o que já está lá, só estender.
2. Confira a seção 9 (Critérios de aceite) itens 4 e 5 aplicáveis a esta tarefa:
   - Item 4: demo app com as 24 rotas navegáveis (`npm run demo`), **sem erro no
     console do navegador** — confirme isso manualmente ou via alguma forma de
     verificação automatizada, já que é o critério explícito.
   - Item 5: `npm test` (Karma) continua passando 100%, nenhuma regressão. Essa
     tarefa não deveria alterar nenhum arquivo de `src/`, só `demo/` + possivelmente
     `package.json`/`package-lock.json` (nova devDependency `angular-route`) — se
     mexer em algo de `src/`, justificar por quê.
3. Cada página de componente deve mostrar variações que ajudem na comparação visual
   contra `ui.nuxt.com` (próximo critério de aceite): pelo menos 2-3 combinações de
   props relevantes (cores, tamanhos, variants) lado a lado, não só um exemplo
   isolado — isso vai poupar trabalho manual na tarefa seguinte.
4. Preste atenção especial à página do `geCalendar`: o próximo critério de aceite
   (depois desta tarefa) é navegação por teclado confirmada manualmente nessa
   página — garanta que a rota do Calendar tenha um exemplo interativo montado de
   forma que dê pra testar teclado nele (não só um snapshot estático).

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
