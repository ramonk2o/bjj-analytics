# Backlog

Ideias de funcionalidades, as funcionalidades em construção e bugs e débitos deixados para depois, gerenciados com o skill `document`. Funcionalidades implementadas saem deste arquivo: o que mudou vai para o CHANGELOG.md e as regras para o SPEC.md.

Status: **Ideia** → **Em andamento** (cada uma no seu branch) → pronta (sai do arquivo no commit que a implementa). Ideias descartadas vão para a última seção.

## Regras gerais

### Faltam testes: regras gerais
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber.
- **Descrição:** testes para as regras de "Regras que valem para tudo" que ainda não têm:
  - a média semanal conta a partir do primeiro treino quando o período escolhido começa antes dele;
  - a tendência da atividade fica "estável" quando a variação não passa de 1 treino nem de 25% da média das últimas 12 semanas.

## Cards do topo

### Faltam testes: cards do topo
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber.
- **Descrição:** testes para:
  - a data estimada do próximo marco, pela média semanal do período;
  - sem streak ativo, o card mostra há quantas semanas não se atinge o mínimo (o texto é montado na interface, fora de `src/core`).

## Evolução (graduação)

### Chegada estimada na preta conta aulas a mais ou a menos
- **Status:** Ideia
- **Tipo:** Bug
- **Motivação:** a Trajetória mostra uma data de chegada na preta errada, que é justamente a projeção mais longa e mais olhada.
- **Descrição:** a conta da faixa preta soma as aulas para sair da faixa anterior sem olhar se ela é a faixa atual, e desconta sempre o excedente da faixa atual.
  - Na marrom, as aulas que faltam na marrom entram duas vezes: com média de 5/semana e poucas aulas na faixa, a chegada sai cerca de 85 semanas depois do certo.
  - Na branca ou azul, com aulas além do necessário na faixa atual, o excedente é descontado de novo na marrom, e a chegada sai adiantada.
  - Para reproduzir: `computeBeltTrajectory` com a faixa atual marrom, 10 aulas nela e média 5; a chegada estimada da preta fica em ~168 semanas em vez de ~83.
  - A versão de arquivo único tinha o mesmo erro.
- **Decisões:**
  - A regra do SPEC.md continua valendo: as aulas excedentes da faixa atual são descontadas só da faixa seguinte.

### Faltam testes: graduação
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber.
- **Descrição:** testes para o desconto das aulas excedentes da faixa atual na faixa seguinte, e para a chegada estimada na preta (junto com a correção do bug acima).

## Treinos

### Remover a segunda curva do gráfico de treinos acumulados
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** o gráfico tem código para desenhar uma curva de "todos" por baixo da principal, mas como ele segue o filtro da seção, as duas curvas são sempre iguais e a segunda nunca aparece. É código morto que confunde quem lê.
- **Descrição:** tirar a série acumulada de "todos" dos stats e a linha correspondente do gráfico, sem mudar o que aparece na tela.

### Faltam testes: treinos
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber.
- **Descrição:** testes para o dia da semana mais forte, o mês mais ativo e a semana mais ativa de "Volume e frequência".

## Marcos

### Faltam testes: marcos
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber.
- **Descrição:** testes para a escada de streaks (sem data estimada) e para os badges de 2 e 3 treinos no mesmo dia desbloqueados, contando treinos oficiais e não oficiais.

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

### Faltam testes: análise detalhada
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber.
- **Descrição:** testes para a taxa de presença (dias úteis com treino oficial ÷ dias úteis do período) e para a contagem por dia da semana, com os não oficiais à parte.

## Configurações

### Faltam testes: configurações
- **Status:** Ideia
- **Tipo:** Débito
- **Motivação:** regras do SPEC.md sem teste podem quebrar sem ninguém perceber, e hoje essa lógica fica na interface, onde não dá para testar.
- **Descrição:** levar para `src/core` a validação ao salvar as configurações e testá-la: aulas por grau vazio ou 0 volta ao padrão, o mínimo de treinos por semana fica entre 1 e 7, e um período desconhecido volta a 3 meses.
