# Colecao Pokemon Mobile Web

Web app mobile-first criado a partir dos templates HTML existentes, pronto para publicar na Vercel e abrir no celular como uma WebView/PWA.

## Estrutura

- `www/index.html`: tela principal do app.
- `www/Templates/view-colecao.html`: sub-view de uma coleção.
- `www/js/app-data.js`: camada de dados preparada para trocar `localStorage` por uma persistência real depois.
- `www/js/minhas-cartas.js`: comportamento da tela principal.
- `www/js/view-colecao.js`: comportamento da tela de coleção.
- `www/manifest.webmanifest`: metadados para abrir em modo app no mobile.
- `sql/schema.sql`: estrutura inicial pensada para SQLite.
- `vercel.json`: configuração para publicar a pasta `www` na Vercel.
- `DEPLOY_VERCEL.md`: passo a passo para publicar e entender a persistência local.

## Valores das cartas

Ao abrir uma coleção, o app tenta buscar dados públicos da Pokémon TCG API e preenche nome, raridade e valor médio/mercado por número da carta.

- Evoluções Prismáticas usa `set.id:sv8pt5`.
- Fogo Fantasmagórico usa `set.name:"Phantasmal Flames"`.
- Os dados ficam em cache no navegador por 6 horas.
- Se a API não tiver preço para uma carta, o app mostra `Valor indisponível`.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5174`.

## Publicar na Vercel

Use a pasta `MobileApp` como raiz do projeto na Vercel.

Configurações esperadas:

- Build Command: `npm run build`
- Output Directory: `www`
- Install Command: `npm install`

O arquivo `vercel.json` já deixa isso configurado.

Veja o passo a passo completo em `DEPLOY_VERCEL.md`.

## Persistência por dispositivo

Enquanto não houver login, a coleção é salva no navegador do próprio dispositivo com `localStorage`.

Chaves usadas:

- `colecao-pokemon:v3`: cartas obtidas, duplicadas e removidas.
- `colecao-pokemon:device-id`: identificador anônimo local gerado no primeiro acesso.
- `colecao-pokemon:exchange-rates`: cache de cotação.

Não é possível usar MAC address em um app web público: navegadores bloqueiam esse dado por segurança. Se o usuário trocar de aparelho, usar outro navegador ou limpar os dados do site, a coleção local não acompanha.

## Sobre SQLite

Um site hospedado na Vercel não consegue acessar um arquivo SQLite local do celular como um app nativo faria. Para manter a ideia preparada, a UI usa `window.PokemonCollectionStore`.

Depois você pode trocar a implementação interna por:

- SQLite em WebAssembly/IndexedDB no navegador;
- uma API serverless na Vercel usando banco externo;
- ou SQLite nativo se esse mesmo front for embutido em um app Capacitor/Cordova futuramente.
