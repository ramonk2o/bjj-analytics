# A lógica de cálculo é pura

`src/core` não usa DOM, `localStorage` nem `new Date()`: as configurações e o "agora" chegam como parâmetros, para que as regras sejam testadas com datas fixas. O acesso ao navegador fica em `src/data`, e o desenho em `src/ui`.
