# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui. O formato segue o [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), e as versões seguem o [Versionamento Semântico](https://semver.org/).

## [Unreleased]

### Changed
- O app virou um projeto Vite + TypeScript com testes; o build continua gerando um único `bjj-analytics.html` que abre com duplo clique, com o mesmo comportamento de antes (só estrutura do projeto, o produto não muda).

### Fixed
- A data prevista para o próximo marco no gráfico de treinos acumulados não mostra mais o dia seguinte quando a previsão cai depois das 21h.
- A chegada estimada das próximas faixas e a ETA dos marcos de treinos não oficiais usam a média semanal do período escolhido nas configurações, como as demais estimativas.
- O snapshot exportado à noite não sai mais com a data do dia seguinte no nome do arquivo.
