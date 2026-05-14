# Seedance Prompt Studio

## Local development

```bash
npm install
npm run dev
```

`npm run dev` now starts both the Vue client and the local backend.

## Admin console

- Admin route: `/#/admin`
- Backend API proxy: `/api`
- Admin password is loaded from `.env.server.local` via `SEEDANCE_ADMIN_PASSWORD`

Environment variables are documented in [`.env.example`](C:/Users/FHY/Documents/Seedance2/.env.example).

## Production notes

- `VITE_APP_BASE_PATH` is for subpath deployments such as `/seedance/`.
- `VITE_DEV_PROXY_TARGET` only affects local `vite dev`. It does not exist in production.
- Relative API addresses such as `/api` now fail fast in production so they do not silently point at the static host.
- Production builds now ignore `VITE_SEEDANCE_API_KEY` and `VITE_SEEDANCE_IMAGE_API_KEY` unless `VITE_ALLOW_CLIENT_API_KEYS=true` is set explicitly.
- Do not ship vendor API keys inside a public frontend bundle. This project now supports browser-local API settings for internal deployments; public deployments should still add a server-side proxy.

## Build

```bash
npm run build
npm run preview
```
