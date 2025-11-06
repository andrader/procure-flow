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

## Install

Install dependencies for client and server separately:

```sh
# Client
cd client
bun install

# Server
cd ../server
bun install
```

## Develop

Run client and server in separate terminals:

```sh
# Terminal 1 – client
cd client
bun run dev

# Terminal 2 – server
cd server
bun run ts-node src/index.ts
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
cd client && bun run build
cd ../server && bun run build
```

Then deploy the server output and `client/dist` as needed for your platform.
