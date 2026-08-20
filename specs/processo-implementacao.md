# Processo de implementação — Claude ⇄ Cursor ⇄ Claude ⇄ TickTick

> Processo operacional válido para todas as etapas do Gravity Elements (não é específico da Etapa 0). Referenciado a partir de cada spec de etapa.

## Papel de cada ferramenta

- **Claude (Cowork, esta sessão de planejamento)** — escreve a especificação técnica e a spec de implementação de cada etapa (com o TODO da seção 9, espelhando exatamente os títulos das tarefas do TickTick); depois de cada entrega, verifica de forma independente o que foi feito e sincroniza o status no TickTick. Também é quem versiona no GitHub e resolve pendências de repositório/segurança.
- **Cursor** — implementa o código, uma tarefa do TODO por vez, em modo Plan.
- **TickTick** — sistema de tracking do progresso (grupo "Gravity Elements", um projeto por etapa). **O Cursor nunca acessa o TickTick.** A única fonte que o Cursor lê e escreve é o TODO (seção 9) do arquivo de spec da etapa.

## Fluxo por tarefa (não por etapa inteira)

Cada tarefa do TODO vira **um chat de Plan mode separado no Cursor** — não um chat único cobrindo a etapa toda.

1. **Abrir o chat no Cursor** com um prompt que inclua obrigatoriamente:
   - O texto exato da tarefa, copiado do TODO (seção 9 da spec da etapa).
   - Referência à(s) seção(ões) correspondente(s) da especificação técnica (`gravity-elements-especificacao-tecnica.md`) relevantes para aquela tarefa.
   - Instrução explícita para o Cursor **inspecionar o estado atual do repositório** antes de propor qualquer coisa — não assumir nada de conversas anteriores.
   - O arquivo `plantask.md` (raiz do repo) é o template reaproveitável para montar esse prompt.
2. **Plan** — o Cursor propõe o que vai ser criado/alterado (arquivos, funções, testes). Não implementa nada ainda.
3. **Aprovação** — Otávio revisa e aprova o plano antes do build.
4. **Build** — o Cursor implementa e roda qualquer verificação aplicável (testes, lint).
5. **Atualizar o TODO** — só depois de **verificar o comportamento** (não só escrever código e assumir que funciona), o Cursor marca o item como `- [x]` na seção 9 da spec da etapa, com uma sub-linha de evidência (comandos rodados, resultado, arquivos criados). Não altera o texto do item.
6. **Próxima tarefa (regra a partir da Etapa 2)** — depois que esta sessão (Claude/Cowork) verifica de forma independente a entrega (passo "Sincronização com o TickTick" abaixo) e o Otávio confirma que está de acordo, esta sessão reescreve `plantask.md` (raiz do repo) inteiro com a instrução da **próxima** tarefa do TODO — não é o Cursor que decide a próxima tarefa nem que edita `plantask.md` sozinho. `plantask.md` é sempre sobrescrito (não acumula histórico de tarefas antigas — isso já vive na sub-linha de evidência da spec da etapa) e sempre reflete só a tarefa corrente a ser aberta num novo chat de Plan mode no Cursor.

## Sincronização com o TickTick (regra crítica)

A sincronização do TickTick é feita **exclusivamente por esta sessão (Claude/Cowork)**, nunca pelo Cursor, e **nunca por confiança em relato** — nem do Cursor, nem do próprio Otávio dizendo "pronto, feito".

Antes de marcar qualquer tarefa como concluída no TickTick:
1. Ler a evidência escrita no TODO da spec.
2. **Verificar diretamente** — inspecionar o código real, rodar `eslint`/testes quando possível, checar `git log`/`git status`/`git diff --stat`, ler o conteúdo real dos arquivos citados como evidência.
3. Só então marcar a tarefa como concluída no TickTick (e, se necessário, corrigir/reabrir a evidência na spec quando a verificação não bater com o que foi relatado).

Esse padrão já pegou dois problemas reais neste projeto: um token do GitHub que ficou parcialmente exposto mesmo depois de um "resolvido" reportado, e uma tarefa do TODO marcada como pronta sem o ambiente de teste realmente validado.

## Demo app atualizado a cada tarefa, não em lote no fim da etapa (regra a partir da Etapa 2)

Na Etapa 1, o demo app (rotas + páginas) foi construído como uma tarefa separada, feita só depois dos 24 componentes já implementados. Consequência: uma quantidade grande de bugs de comparação visual com o `ui.nuxt.com` (cor `neutral`→`slate`, espessura de `ring`, span de transclude vazio desalinhando label, host/inner não herdando stretch em FieldGroup/Skeleton, ícones ausentes, etc.) só apareceu numa rodada de "equalização" tardia, todos de uma vez, em vez de serem pegos um a um logo após cada componente ficar pronto — mais caro de investigar em lote e mais fácil de confundir a causa raiz de um bug com a de outro.

A partir da Etapa 2, cada tarefa `Componente: X` do TODO passa a incluir, como parte da própria definição de pronto (não como tarefa à parte):
1. Adicionar/atualizar a rota de `X` em `demo/routes.js` e a página correspondente em `demo/pages/<categoria>/<x>.html`, espelhando os exemplos da doc `ui.nuxt.com` (mesmo padrão já estabelecido na Etapa 1 — Usage/variações principais, seções extras rotuladas "(extensão Gravity)" quando aplicável).
2. Comparação visual pontual daquele componente com `ui.nuxt.com` **no momento em que a tarefa é verificada**, não adiada para o fim da etapa.
3. A evidência da tarefa (sub-linha do TODO) deve citar a rota do demo tocada, não só os 4 arquivos do contrato + testes.

O shell do demo (nav lateral, `index.html`, bootstrap, roteamento `ngRoute`, cache-busting) já existe desde a Etapa 1 e não precisa ser reconstruído — cada etapa nova só estende `routes.js` e adiciona páginas. Uma tarefa de "Demo app" separada só volta a fazer sentido se a etapa tiver um entregável de demo que não seja 1:1 com um componente (ex.: a Etapa 2 tem um critério de aceite de formulário composto — login + cadastro usando 100% dos componentes da etapa — que é, por natureza, uma tarefa à parte, feita depois que os componentes individuais já existem).

## Outras práticas estabelecidas

- **Commits incrementais** — não acumular "centenas de arquivos alterados" para um commit gigante no final; commitar em pedaços pequenos e coerentes, um por entrega/tarefa quando possível.
- **Nunca lidar com credenciais/tokens diretamente** — se um token aparecer exposto (ex.: em `git remote -v`), alertar o Otávio e instruir a correção; nunca imprimir, logar, reutilizar ou commitar o valor.
- **Checagem de colisão de nome/marca antes de adotar publicamente** — lição do caso GravityUi → Gravity Elements (colisão com o "Gravity UI" da Yandex). Qualquer nome novo (projeto, módulo público, pacote) deveria passar por uma checagem rápida antes de virar definitivo.
- **Verificação independente como padrão geral** — vale para qualquer alegação de "está pronto", em qualquer contexto (código, ambiente, configuração), não só para o TickTick.

## Pendências relacionadas a este processo

- Definição de modelo/nível de esforço recomendado para os chats do Cursor foi discutida em sessão anterior, mas não ficou registrada formalmente aqui — se for retomada, documentar o resultado nesta seção.
