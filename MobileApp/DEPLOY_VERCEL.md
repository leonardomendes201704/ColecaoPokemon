# Deploy na Vercel

Este app publica como site estático público. Não precisa Android Studio, SDK Android, emulador ou build nativo.

## Opção recomendada: GitHub + Vercel

1. Suba este projeto para um repositório no GitHub.
2. Entre em https://vercel.com.
3. Clique em **Add New > Project**.
4. Importe o repositório.
5. Configure:
   - **Root Directory:** `MobileApp`
   - **Install Command:** `npm install`
   - **Build Command:** `npm run build`
   - **Output Directory:** `www`
6. Clique em **Deploy**.

Ao finalizar, a Vercel vai gerar uma URL pública parecida com:

```text
https://nome-do-projeto.vercel.app
```

## Opção via Vercel CLI

Dentro desta pasta:

```bash
npm install
npm run build
npx vercel
```

Quando a Vercel perguntar a pasta/output, use `www`. O arquivo `vercel.json` já define essa configuração.

## Persistência por dispositivo

Nesta versão não existe usuário/login. As cartas obtidas ficam salvas no navegador do próprio dispositivo usando `localStorage`.

Chaves usadas:

```text
colecao-pokemon:v3
colecao-pokemon:device-id
colecao-pokemon:exchange-rates
```

Comportamento esperado:

- Cada celular/navegador tem sua própria coleção.
- Atualizar a página mantém as cartas obtidas.
- Fechar e abrir o navegador mantém os dados.
- Outro celular começa com outra coleção local.
- Limpar dados do navegador apaga a coleção local.

## Por que não MAC address

Um app web hospedado na Vercel não consegue ler MAC address. Chrome, Safari, Edge e WebViews bloqueiam isso por segurança e privacidade.

O app usa um `device-id` anônimo gerado no primeiro acesso e salvo no `localStorage`. Ele serve apenas como identificador local e pode ser usado no futuro para migração para banco/API.
