# @emitsignal/website

Web dashboard for the EmitSignal notification platform. Built with TanStack Start, TanStack Router, React 19, and Tailwind CSS v4.

## Stack

- **Framework:** TanStack Start (SSR)
- **Routing:** TanStack Router (file-based)
- **UI:** React 19 + Tailwind CSS v4
- **Build:** Vite + Nitro

## Scripts

| Script            | Description                         |
| ----------------- | ----------------------------------- |
| `bun run dev`     | Start Vite dev server on port 5000  |
| `bun run build`   | Build for production (Nitro output) |
| `bun run preview` | Preview the production build        |
| `bun test`        | Run tests with Vitest               |

## Getting Started

```bash
bun install
bun run dev
```

Requires the [EmitSignal server](../emitsignal-server) to be running. Set `VITE_API_URL` to the server address.

## Environment Variables

| Variable       | Default                 | Description         |
| -------------- | ----------------------- | ------------------- |
| `VITE_API_URL` | `http://localhost:3333` | Server API base URL |
