# Um único HTML que funciona sem rede

O app é compartilhado mandando um arquivo e aberto com duplo clique, então o build gera um único `bjj-analytics.html` com tudo embutido (Vite + `vite-plugin-singlefile`), que precisa funcionar aberto por `file://`. Por isso não há requisições de rede, CDNs nem analytics, e as fotos nunca saem do computador. A versão no GitHub Pages é o mesmo app.
