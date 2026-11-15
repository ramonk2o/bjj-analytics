# Jiu-Jitsu Analytics

Relatório pessoal de treinos de jiu-jitsu montado a partir de uma pasta de fotos, em que cada foto é um treino. Entre parênteses, o nome do conceito no código.

## Language

### Pasta e treinos

**Pasta de fotos**:
A pasta `jiu-jitsu` que o usuário escolhe, com uma subpasta por faixa.
_Avoid_: diretório, biblioteca

**Pasta da faixa** (`Belt.id`):
A subpasta de uma faixa, de `00-branca` a `04-preta`. Os treinos dentro dela são daquela faixa.

**Treino** (`Training`):
Uma foto `AAAA-MM-DD[-a][_]` numa pasta da faixa. É único por faixa, data, sufixo e oficial/não oficial.
_Avoid_: sessão, foto (quando se fala do treino)

**Sufixo** (`suffix`):
As letras `-a`, `-b`… depois da data, que separam treinos no mesmo dia.

**Treino oficial** (`official: true`):
Treino na academia. Conta nos números principais e na graduação.

**Treino não oficial** (`official: false`):
Treino fora da academia, marcado por `_` antes da extensão.
_Avoid_: treino extra, treino livre

**Aula**:
Um treino oficial, na linguagem da graduação ("aulas por grau", "aulas na faixa").

### Faixas e graduação

**Faixa** (`Belt`, `BeltClass`):
Branca, azul, roxa, marrom ou preta. A faixa atual é a do treino oficial mais recente.

**Grau**:
Uma das 4 etapas dentro de uma faixa. Cada uma pede as aulas por grau.

**Aulas por grau** (`beltRules`):
Quantas aulas na faixa cada grau pede, configurável por faixa.

**Graduação** (`Graduation`):
A passagem para a faixa seguinte, depois do 4º grau, com 5× as aulas por grau no total. A preta não tem graduação por aulas.
_Avoid_: promoção (fora de "esperando promoção")

**Trajetória** (`computeBeltTrajectory`, `BeltCard`):
As faixas passadas, a atual e as futuras, com aulas, tempo e chegada estimada.

### Tempo

**Semana** (`weekStartOf`, `isoWeekKey`):
Semana ISO, de segunda a domingo.

**Semana atual**:
A semana de hoje. Fica fora dos números, a não ser com "Incluir semana atual" ligado (`includeCurrentWeek`).

**Semana de referência**:
A última semana que conta: a atual com o switch ligado, a passada com ele desligado.

**Período analisado**:
Do primeiro treino até o fim da semana de referência.

**Período da média** (`weeklyAvgPeriod`):
A janela das configurações (3, 6 ou 12 meses, ou todo o histórico) usada na média semanal do período.

**Média semanal do período** (`weeklyAvg`):
Treinos oficiais por semana no período da média. É a base de todas as estimativas.
_Avoid_: ritmo

**Ritmo na faixa**:
Aulas na faixa ÷ semanas desde a primeira aula nela. É a segunda estimativa da graduação.

**Dia útil**:
Segunda a sexta.

**Taxa de presença** (`trainedRatio`):
Dias úteis com treino oficial ÷ dias úteis do período analisado.

### Consistência

**Mínimo semanal** (`streakMin`):
Quantos treinos uma semana precisa para contar no streak (padrão 2).

**Streak** (`WeekStreak`):
Semanas seguidas que atingem o mínimo semanal, contando todos os treinos.
_Avoid_: sequência, ofensiva

**Streak atual** (`currentStreak`, `streakIsActive`):
O streak que termina na semana de referência ou na anterior a ela.

**Gap** (`WeekGap`):
As semanas abaixo do mínimo semanal entre dois streaks.
_Avoid_: buraco, pausa

### Marcos

**Próximo marco** (`nextMilestoneTotal`):
O próximo múltiplo de 50 treinos oficiais, mostrado nos cards do topo.

**Badge** (`Badge`):
Uma conquista desbloqueada ao atingir um valor numa escada. A seção "Marcos" mostra os badges.
_Avoid_: conquista, troféu

**Escada** (`BadgeGroup`):
Um grupo de badges em ordem crescente: treinos oficiais, treinos não oficiais, maior streak e teste de limites.

**Semana cheia** (`fullWeekStarts`):
Semana com treino em todos os dias úteis.

### Saída

**Snapshot**:
O HTML estático do relatório como está na tela, sem fotos nem controles.
