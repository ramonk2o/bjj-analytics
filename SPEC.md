# Jiu-Jitsu Analytics

Como o Jiu-Jitsu Analytics funciona hoje, em regras (não detalhes visuais), mais seus dados e decisões técnicas. Gerenciado com o skill `document`: é atualizado quando uma funcionalidade termina, descrevendo o que foi construído. Ideias ficam no BACKLOG.md; o que mudou e quando fica no CHANGELOG.md.

## Objetivo

Relatório pessoal de treinos de jiu-jitsu montado a partir de uma pasta de fotos: cada foto é um treino. Mostra frequência, streaks, progresso de graduação e marcos. Roda inteiro no navegador, num único arquivo HTML, e as fotos nunca saem do computador.

## Pasta de fotos

- O usuário escolhe uma pasta (a pasta `jiu-jitsu`). Dentro dela, cada faixa tem uma subpasta: `00-branca`, `01-azul`, `02-roxa`, `03-marrom`, `04-preta`. Subpastas que não existem são ignoradas.
- Cada arquivo `AAAA-MM-DD.jpg` (ou `.jpeg`, `.png`, sem diferenciar maiúsculas) é um treino na faixa da subpasta, naquela data.
  - `-a`, `-b`… depois da data separam mais de um treino no mesmo dia (`2025-06-27-a.jpg`).
  - `_` antes da extensão marca o treino como **não oficial** (fora da academia): `2025-11-23_.jpg`, `2025-11-23-a_.jpg`.
  - Arquivos com outro nome são ignorados.
- Um treino é único por faixa, data, sufixo e oficial/não oficial. O mesmo treino em formatos diferentes conta uma vez só.
- A pasta escolhida é lembrada. Ao abrir o app, se o navegador ainda dá permissão de leitura, o relatório carrega direto. Se não, o botão vira "Continuar com a pasta anterior" e pede a permissão no clique.
- "Atualizar" lê as pastas de novo e redesenha tudo.

## Comportamento

### Regras que valem para tudo
- **Semanas** vão de segunda a domingo.
- **Semana atual:** por padrão fica fora de todos os números, porque ainda não terminou. O switch "Incluir semana atual" coloca ela de volta em tudo. Com o switch desligado, o período analisado termina no domingo passado.
- **Calendário com o switch desligado:** o calendário segue até a semana de hoje, mas os dias desta semana aparecem sem treino, porque os dados param no domingo passado. É o comportamento esperado.
- **Média semanal do período:** é a base de todas as estimativas (próximo marco, graduação, faixas futuras, badges). Conta os treinos de um período escolhido nas configurações (últimos 3, 6 ou 12 meses, ou todo o histórico) até o fim do período analisado. Se o período começa antes do primeiro treino, conta a partir do primeiro treino. A média mensal segue o mesmo período, e um período menor que um mês conta como um mês.
- **Oficiais e não oficiais:** os números principais (total, médias, graduação, marcos de treinos) contam só os oficiais. Streaks, gaps e as barras semanais contam todos os treinos, para um treino fora da academia não criar um buraco falso.
- **Streak** é uma sequência de semanas seguidas com pelo menos N treinos (N nas configurações, padrão 2). Uma semana abaixo de N quebra o streak, e as semanas abaixo de N entre dois streaks formam um **gap**.
- **Streak atual:** continua ativo se a última semana que atingiu N é a semana de referência ou a anterior a ela. A semana de referência é a atual, com o switch ligado, ou a passada, com ele desligado.

### Cards do topo
- **Faixa atual** (no cabeçalho): a faixa do treino oficial mais recente, com o tempo desde o primeiro treino oficial nela.
- **Total de treinos:** oficiais, com os não oficiais indicados à parte (`+N`).
- **Próximo marco:** o próximo múltiplo de 50 treinos oficiais, quanto falta e a data estimada pela média semanal do período.
- **Maior streak** e **streak atual**, em semanas. Sem streak ativo, mostra há quantas semanas não se atinge o mínimo.
- **Média semanal** do período configurado.
- **Último treino** oficial e há quantos dias ("hoje", "ontem", "há N dias").

### Evolução (graduação)
- Cada faixa tem 4 graus, e cada grau pede um número de aulas oficiais na faixa (configurável). Os padrões são branca 30, azul 65, roxa 75 e marrom 85. Depois do 4º grau, a próxima graduação é a faixa seguinte, com 5× as aulas por grau no total.
- O grau atual é calculado pelas aulas na faixa, com no máximo 4, ou vem fixo das configurações ("Grau atual").
- Mostra quanto falta para a próxima graduação e duas datas estimadas:
  - pela média semanal do período;
  - pelo ritmo desde que entrou na faixa (aulas na faixa ÷ semanas desde a primeira aula nela).
  As estimativas arredondam para semanas inteiras. Se já atingiu o necessário, aparece "pronto, esperando promoção" e quantas aulas passou.
- **Faixa preta:** sem graus por aulas. Mostra só as aulas e o tempo na faixa.
- **Trajetória:** para cada faixa, o total de aulas oficiais.
  - Faixas passadas: o tempo do primeiro ao último treino nela e o mês de chegada.
  - Faixa atual: o tempo nela e o tempo total de jiu-jitsu.
  - Faixas futuras: tempo na faixa e chegada estimados pela média semanal do período. As aulas que passaram do necessário na faixa atual são descontadas da faixa seguinte. Sem média, não há projeção.
  - A preta mostra "o caminho de uma vida".

### Treinos
- Um filtro (Todos, Oficiais, Não oficiais) vale só para esta seção: calendário, volume e frequência, atividade semanal e treinos acumulados.
- **Calendário:** um quadrado por dia, do domingo da semana do primeiro treino até o sábado da semana de hoje. A intensidade vai de 1 a 3 ou mais treinos no dia, com cores próprias para dias só não oficiais e dias mistos. Dias futuros ficam vazios.
- **Volume e frequência:** total, dias diferentes, médias semanal e mensal, dia da semana mais forte, mês mais ativo e semana mais ativa.
- **Atividade:** treinos por semana, do primeiro treino à semana de referência, com a linha da média semanal do período.
  - A tendência compara as últimas 12 semanas: "subindo" ou "caindo" quando a variação passa de 1 treino ou de 25% da média dessas semanas (o que for maior); se não, "estável".
- **Treinos acumulados:** curva dos oficiais e, por baixo, a de todos. Tem marcadores a cada 25, 50 ou 100 treinos, conforme o total, e uma projeção tracejada até o próximo múltiplo de 50 pela média mensal do período.

### Marcos
- Badges em quatro grupos:
  - **Treinos oficiais:** 10, 25, 50, 100… até 10.000.
  - **Treinos não oficiais:** 10 até 1.500.
  - **Maior streak**, em semanas: 2, 4, 8, 12, 16, 26, 52, 78, 104, 156.
  - **Teste de limites:** 2 e 3 treinos no mesmo dia, e 1, 2 ou 3 semanas seguidas "cheias" (todos os dias úteis, de segunda a sexta, com treino).
- O próximo badge de cada escada mostra quanto falta e, nas escadas de treinos, uma data estimada. Os oficiais usam a média semanal do período; os não oficiais, a média semanal dos não oficiais no mesmo período.
- A seção abre sempre recolhida.

### Análise detalhada
- **Sequências e consistência:** maior streak, streak atual, maior gap e uma linha do tempo de streaks e gaps.
- **Taxa de presença:** dias úteis com treino oficial ÷ dias úteis do período.
- **Dias da semana:** treinos oficiais por dia, com os não oficiais à parte e o dia mais forte em destaque.
- **Dias com múltiplos treinos:** recorde num dia, dias com 2 ou mais e com 3 ou mais treinos, e a distribuição.

### Fotos
- Passar o mouse num dia do calendário mostra a data e os treinos do dia. Depois de um instante, aparecem as prévias de até 3 fotos.
- Clicar num dia com treino abre todas as fotos do dia. Clicar numa foto abre ela numa aba nova. Esc ou clique fora fecha.

### Snapshot exportado
- "Exportar snapshot" baixa um HTML estático do relatório como está na tela, com o nome `jiu-jitsu-report-AAAA-MM-DD.html` (dia local).
- O snapshot não tem fotos nem controles (atualizar, switch, configurações). Os tooltips são só de texto e a seção de Marcos continua recolhível.

## Configurações

| Opção | Valores | Padrão |
|---|---|---|
| Aulas por grau (branca, azul, roxa, marrom) | número (o campo sugere 1 a 200); vazio ou 0 volta ao padrão | 30, 65, 75, 85 |
| Período da média semanal | 3, 6, 12 meses ou todo o histórico | 3 meses |
| Mínimo de treinos por semana para o streak | 1 a 7 | 2 |
| Grau atual | automático ou fixo de 0 a 4 | automático |

Salvar redesenha o relatório na hora.

## Dados guardados

Tudo fica no navegador:
- **IndexedDB** (`jiu-jitsu-report`): o acesso à pasta escolhida.
- **localStorage:**
  - `jja-settings`: as configurações;
  - `includeCurrentWeek`: o switch da semana atual;
  - `collapsed:<seção>`: seções recolhidas.

## Decisões técnicas

- **Um único HTML com tudo embutido** (Vite + `vite-plugin-singlefile`): o app é compartilhado e aberto com duplo clique, sem servidor nem internet.
- **Só navegadores Chromium** (Chrome, Edge, Brave): a leitura da pasta usa a File System Access API.
- **TypeScript strict.** A lógica de cálculo (`src/core`) é pura e recebe as configurações e o "agora" como parâmetros, para ser testada com datas fixas. O acesso ao navegador fica em `src/data`, e o desenho em `src/ui`.
- **Chaves de armazenamento mantidas** da versão de arquivo único (`legacy/bjj-analytics.html`), para quem atualiza não perder configurações nem a pasta escolhida.

## Limitações conhecidas

- Não funciona em Firefox nem Safari (sem File System Access API).
- Trocar de faixa depende de mover as fotos para a subpasta da nova faixa. O app não sabe a data real da graduação, só a do primeiro treino na faixa.
