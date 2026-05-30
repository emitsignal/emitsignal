# @emitsignal/emails

Transactional email templates built with [React Email](https://react.email). Templates are rendered to HTML on the server and sent through the email queue.

## Templates

| Template        | File                         | Description                       |
| --------------- | ---------------------------- | --------------------------------- |
| Magic Link      | `emails/magic-link.tsx`      | 6-character sign-in code          |
| Welcome         | `emails/welcome.tsx`         | Onboarding email                  |
| Message Alert   | `emails/message-alert.tsx`   | New message on a subscribed topic |
| Weekly Digest   | `emails/weekly-digest.tsx`   | Weekly topic activity summary     |
| API Key Created | `emails/api-key-created.tsx` | New API key notification          |

## Scripts

| Script           | Description                                   |
| ---------------- | --------------------------------------------- |
| `bun run dev`    | Start React Email preview server on port 3000 |
| `bun run build`  | Build the email templates                     |
| `bun run export` | Export rendered HTML                          |
| `bun run static` | Serve exported emails on port 5002            |

## Usage (from server)

```ts
import { MagicLinkEmail, render } from '@emitsignal/emails';

const html = await render(
    <MagicLinkEmail
        code="abc123"
        email="user@example.com"
        expiresAt={new Date()}
        magicLinkUrl="https://app.example.com/auth/verify?code=abc123&email=…"
    />,
);
```

All templates are exported from the package root alongside their prop types (e.g. `MagicLinkEmailProps`). `render` is re-exported from `@react-email/render`.

## Getting Started

```bash
bun install
bun run dev
```

Open [localhost:3000](http://localhost:3000) to preview templates in the browser.
