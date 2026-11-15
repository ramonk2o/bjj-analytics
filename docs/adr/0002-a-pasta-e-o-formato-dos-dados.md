# A pasta de fotos é o formato dos dados

Não há banco nem importação: os dados são a pasta de fotos que o usuário já mantém. A faixa vem da subpasta (`00-branca` … `04-preta`) e o treino vem do nome do arquivo (`AAAA-MM-DD[-a][_]`), lidos só em `src/core/filename.ts`. Mudar essa leitura quebra pastas reais.

## Consequences

O app não sabe a data real de uma graduação, só a do primeiro treino na faixa nova, e trocar de faixa depende de mover as fotos para a subpasta dela.
