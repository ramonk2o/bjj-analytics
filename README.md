# BJJ Analytics

Relatório pessoal de treinos de jiu-jitsu montado a partir de uma pasta de fotos: cada foto é um treino. Mostra streaks, médias, calendário, progresso de graduação e marcos.

Roda inteiro no navegador. As fotos nunca saem do seu computador: não há servidor, rede nem analytics.

**Abrir o app:** https://ramonk2o.github.io/bjj-analytics — ou baixe `bjj-analytics.html` e abra direto do disco.

Funciona em navegadores Chromium (Chrome, Edge, Brave), porque usa a File System Access API.

## Como organizar a pasta

```
jiu-jitsu/
├── 00-branca/
│   ├── 2025-06-27.jpg
│   ├── 2025-06-28-a.jpg     ← -a, -b… = mais de um treino no mesmo dia
│   ├── 2025-06-28-b.jpg
│   └── 2025-11-23_.jpg      ← _ no fim = treino não oficial (fora da academia)
├── 01-azul/
├── 02-roxa/
├── 03-marrom/
└── 04-preta/
```

Arquivos `.jpg`, `.jpeg` ou `.png` com o nome `AAAA-MM-DD[-a][_]`. Outros arquivos são ignorados. As regras completas estão em [SPEC.md](SPEC.md).

## Desenvolvimento

```sh
npm install
npm run dev        # servidor Vite
npm test           # testes (Vitest)
npm run build      # gera dist/bjj-analytics.html, um arquivo único
```

## Licença

[MIT](LICENSE)
