# ProcureFlow

## Project info

ProcureFlow is an AI-powered procurement platform for enterprise materials and services management.

## Monorepo layout

This repo is now split into client, server, and shared types:

- `client/` – Vite + React app
- `server/` – Express API and static file server
- `shared/types/` – reusable TypeScript types (e.g. `Product`)

## Requirements

- Node.js (LTS)
- Bun (latest)

## Install (Bun workspaces)

From the repo root, install all workspace dependencies at once:

```sh
bun install
```

## Develop

Run both client and server from the root in separate terminals or with one command:

```sh
# Option A: one command (runs both)
bun run dev

# Option B: separate
bun run dev:client
bun run dev:server
```

Optionally, to serve the built client from the server, first build the client:

```sh
cd client
bun run build

cd ../server
bun run build:all
```

The server serves static files from `client/dist`.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Express (server)

## Deploy

Build the client and the server:

```sh
bun run build
```

Then deploy the server output and `client/dist` as needed for your platform.
