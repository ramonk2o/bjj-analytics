# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), e as versões seguem o [Versionamento Semântico](https://semver.org/).

## [Unreleased]

### Changed
- O app virou um projeto Vite + TypeScript com testes; o build continua gerando um único `bjj-analytics.html` que abre com duplo clique, com o mesmo comportamento de antes (só estrutura do projeto, o produto não muda).

### Fixed
- A data prevista para o próximo marco no gráfico de treinos acumulados não mostra mais o dia seguinte quando a previsão cai depois das 21h.
- A chegada estimada das próximas faixas e a ETA dos marcos de treinos não oficiais usam a média semanal do período escolhido nas configurações, como as demais estimativas.
- O snapshot exportado à noite não sai mais com a data do dia seguinte no nome do arquivo.
- A chegada estimada na faixa preta, na Trajetória, não conta mais aulas a mais quando se está na marrom, nem a menos quando há aulas além do necessário na branca ou na azul.
- Um número negativo em aulas por grau, nas configurações, volta ao padrão em vez de estragar as estimativas de graduação, inclusive quando já estava salvo de antes.
- A taxa de presença não conta mais um dia útil a mais no período (a segunda-feira desta semana, ou amanhã com a semana atual incluída), que deixava a taxa menor do que a real.
- A média mensal também não conta mais um dia a mais no período, o que a deixava um pouco abaixo da real.
