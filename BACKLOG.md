# Backlog

Ideias de funcionalidades, as funcionalidades em construção e bugs e débitos deixados para depois, gerenciados com o skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (cada uma no seu branch) → pronta (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Análise detalhada

### Filtro de oficiais e não oficiais na análise detalhada
- **Status:** Ideia
- **Motivação:** "Dias com múltiplos treinos" conta só os oficiais, enquanto os badges de 2 e 3 no mesmo dia contam todos. Um dia com um treino oficial e um não oficial vale o badge, mas não aparece como dia duplo.
- **Descrição:** a análise detalhada passa a depender do filtro de oficiais e não oficiais, como a seção Treinos.
- **Decisões:**
  - Muda a regra "Dias com múltiplos treinos" do SPEC.md, que hoje conta só os oficiais.
- **Perguntas em aberto:**
  - Usa o mesmo filtro da seção Treinos ou um filtro próprio da análise detalhada?
  - Vale para toda a análise (sequências, taxa de presença, dias da semana) ou só para os dias com múltiplos treinos?
  - Qual o padrão: Todos ou Oficiais?

### Taxa de presença conta um dia a mais no período
- **Status:** Ideia
- **Tipo:** Bug
- **Motivação:** a taxa de presença sai menor do que deveria, e o texto "N de M dias úteis" conta um dia útil que não pertence ao período.
- **Descrição:** o período analisado deveria terminar no domingo passado (switch desligado) ou hoje (switch ligado), mas a conta de dias do período (`totalCalendarDays` em `computeStats`, `src/core/stats.ts`) arredonda a diferença para cima e soma 1, e passa a incluir o dia seguinte.
  - Com o switch desligado, entra sempre a segunda-feira desta semana.
  - Com o switch ligado, entra o dia de amanhã quando a hora já passou do meio-dia.
  - Para reproduzir: oficiais em 29/09, 01/10, 04/10 e 06/10/2025 e um não oficial em 30/09, com "agora" em 15/10/2025 12:00 e o switch desligado; de 29/09 a 12/10 há 10 dias úteis, mas `totalWeekdays` fica 11.
  - O teste da taxa de presença (que faltava, como débito) entra junto com a correção.
  - Encontrado ao escrever os testes que faltavam.
