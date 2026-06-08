# Sistema IGS

Base inicial do sistema IGS com Node.js, TypeScript, Express, Prisma e PostgreSQL.

Inclui:

- login com a logo IGS
- cadastro e listagem de emitentes
- cadastro e listagem de usuarios admin
- API com autenticao JWT
- login por `username` sem diferenca entre maiusculo e minusculo

## Configuracao

1. Copie `.env.example` para `.env`.
2. Preencha `DATABASE_URL` com a URL do Render.
3. Defina `JWT_SECRET` com uma chave forte.
4. Instale dependencias com `npm install`.
5. Gere o Prisma Client com `npm run prisma:generate`.
6. Rode o projeto com `npm run dev`.
7. Opcional: rode `npm run prisma:seed` para criar `alex`, `ismael`, `mika` e `daisa`.

Se o backend estiver no Render junto com o Postgres, use a `DATABASE_URL` interna do Render.
Localmente, voce pode usar a URL externa.

## Rotas

- `GET /health`
- `GET /`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /emitentes`
- `POST /emitentes`
- `GET /users`
- `POST /users`

## Telas

- `/` login
- `/emitentes.html` cadastro de emitente
- `/usuarios.html` cadastro de usuarios admin
# sistemaigs
