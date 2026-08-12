<p align="center">
  <img src="public/web-app-manifest-512x512.png" alt="urlo logo" width="120" />
</p>

# urlo-fe

## Description

Frontend for urlo, built with [Next.js](https://nextjs.org/) (App Router), React 19, and TypeScript.

**Current status: initial feature set live.** The application boots with:

- **Config** — typed runtime configuration in `lib/config.ts` (host, port, backend API base URL).
- **Backend proxy** — client-side calls are served by Next.js route handlers in `app/api/` that proxy to urlo-be and forward the `Authorization` header (`lib/proxy.ts`).
- **Auth** — `register`, `login`, and `profile` flows via `/api/auth/*`, with the JWT stored in `localStorage`.
- **Shorten panel** — paste a long URL to get a short link, copy it to the clipboard, and browse your recent links with visit counts.
- **Redirects** — `app/s/[code]` resolves a short code and 302-redirects to the original URL.
- **Admin dashboard** — `/admin` lists every account with role badges, search, stats, and per-user short links. Access is guarded for `admin` roles, and seeded admins are forced to rotate their password on first login.
- **My links** — `/links` is your short-link library: cursor-paginated, searchable by short code or destination, with inline editing of a link's original URL through a modal.

## Pages

| Route | Description |
| ----- | ----------- |
| `/` | Home — shorten panel, auth |
| `/links` | My links — search, paginate, edit |
| `/admin` | Admin dashboard |
| `/s/[code]` | Short-code redirect |

## API proxy overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile` (protected)
- `POST /api/urls`, `GET /api/urls` (my short links)
- `GET /api/urls/my` (paginated my links: `limit`, `cursor`, `q`)
- `PATCH /api/urls/:id/original-url` (edit a link you own)
- `GET /api/admin/users`, `GET /api/admin/users/:id/short-urls`, `PATCH /api/admin/password` (admin)

## Project structure

```text
app/
  layout.tsx            # root layout, Geist fonts, metadata
  page.tsx              # home page
  links/page.tsx        # my links page
  admin/page.tsx        # admin dashboard
  s/[code]/route.ts     # short-code redirect
  api/                  # route handlers proxying to urlo-be
    auth/               # register, login, profile
    urls/               # shorten + my links (+ paginated my, edit original url)
    admin/              # users, short links, password
components/             # client components (auth form, shorten panel, admin, ...)
lib/                    # config, auth, urls, admin, proxy helpers
public/                 # static assets, manifest icons
scripts/start.mjs       # dev/start launcher binding host + port
```

## Project setup

```bash
$ npm install
```

Point `apiBaseUrl` in `lib/config.ts` at your running urlo-be instance.

## Compile and run the project

```bash
# development
$ npm run dev

# production build
$ npm run build

# production mode
$ npm start
```

## Lint

```bash
$ npm run lint
```
