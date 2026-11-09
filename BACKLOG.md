# Backlog

Ideias de funcionalidades, as funcionalidades em construção e bugs e débitos deixados para depois, gerenciados com o skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (cada uma no seu branch) → pronta (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Análise detalhada

### Dias com múltiplos treinos contam todos os treinos
- **Status:** Ideia
- **Motivação:** "Dias com múltiplos treinos" conta só os oficiais, enquanto os badges de 2 e 3 no mesmo dia contam todos. Um dia com um treino oficial e um não oficial vale o badge, mas não aparece como dia duplo.
- **Descrição:** "Dias com múltiplos treinos", na análise detalhada, passa a contar os treinos oficiais e os não oficiais, como os badges de 2 e 3 no mesmo dia. O recorde no dia, os dias duplos e triplos e a distribuição seguem a mesma contagem.
- **Decisões:**
  - Sem filtro novo: era a solução mais simples para acabar com a diferença entre a análise e os badges.
  - O "de N dias" dos dias duplos passa a ser o total de dias com algum treino, oficial ou não.
  - O resto da análise detalhada (sequências, taxa de presença, dias da semana) não muda.
  - Muda a regra "Dias com múltiplos treinos" do SPEC.md, que hoje diz "contando só os treinos oficiais".
