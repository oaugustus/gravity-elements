Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Avatar"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente a seção 7
   (tabela de bindings do geAvatar — `src`/`alt`/`text`/`icon`/`size`/`chipColor`/
   `chipPosition`, com fallback `src` → `text` → `icon` resolvido no controller),
   a seção 5.5 (ARIA: `alt` obrigatório no `<img>` quando `src` é usado; `aria-hidden="true"`
   no fallback de ícone/iniciais quando não há texto acessível equivalente) e a seção 5.6
   (casos de teste mínimos — 2 casos para geAvatar, já que não está na lista de
   componentes com checkpoint manual extra).
2. Leia specs/gravity-elements-especificacao-tecnica.md, seção 5 (contrato de
   componente) se precisar relembrar a estrutura dos 4 arquivos.
3. Inspecione o estado atual do repositório — não assuma nada de conversas anteriores.
   Confirme o que já existe em src/components/element/ (Alert já implementado e
   validado) e os precedentes já estabelecidos nesta etapa para ícone/botão sem
   geIcon/geButton ainda existirem (§5.4 / §5.4.1 — ver alert.component.js e
   error.component.js como exemplos recentes de placeholder aceito).
4. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   src/theme/avatar.ts e src/runtime/components/Avatar.vue em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio). Preste atenção especial a: (a) qualquer classe com opacidade sobre
   `var()` (ex. `bg-*/N`) — TW 3.4.19 deste projeto NÃO compila esse padrão, use
   color-mix() por extenso como em header.theme.js e alert.theme.js (correção recente,
   documentada na evidência da tarefa Alert); (b) o mecanismo de fallback
   src → text/iniciais → icon do Avatar.vue real, pra portar a mesma ordem de
   prioridade.
5. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5 (contrato completo + teste +
   build UMD/Rollup sem regressão) se aplicam a esta tarefa.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
