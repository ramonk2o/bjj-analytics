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
