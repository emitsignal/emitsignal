# @notify/convex

Shared Convex backend for the Notify pub/sub messaging system.

## Structure

```
convex/
├── schema.ts          # Database schema
├── mutations/         # Write operations
│   ├── topics.ts     # Create topics
│   └── messages.ts   # Publish messages
└── queries/          # Read operations
    └── topics.ts     # List/search topics
```

## Setup

1. **Install dependencies** (already done via workspace):
   ```bash
   cd packages/convex
   bun install
   ```

2. **Initialize Convex** (first time only):
   ```bash
   bunx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Generate the `_generated` folder with types
   - Start the local development server

3. **Generate types** (after schema changes):
   ```bash
   bunx convex codegen
   ```

## Usage

### From Mobile App

```typescript
import { api } from "@notify/convex";
import { useMutation, useQuery } from "convex/react";

// Query topics
const topics = useQuery(api.queries.topics.list);

// Create topic
const createTopic = useMutation(api.mutations.topics.createTopic);

// Publish message
const publishMessage = useMutation(api.mutations.messages.publishMessage);
```

### From Server App

```typescript
import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient(process.env.CONVEX_URL);

// Query
const topics = await client.query(api.queries.topics.list);
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
CONVEX_DEPLOYMENT=    # Auto-populated by `convex dev`
CONVEX_URL=          # Auto-populated by `convex dev`
```

## Schema Overview

- **users** - User accounts
- **topics** - Public/private channels
- **topicAccess** - ACL for private topics
- **messages** - Published messages
- **pushTokens** - Expo push tokens
- **subscriptions** - User topic subscriptions

## API

### Mutations

- `topics.createTopic` - Create a new topic
- `messages.publishMessage` - Publish to a topic

### Queries

- `topics.list` - List all topics
- `topics.getByName` - Get topic by name
- `topics.getMessages` - Get messages for a topic

## Deployment

```bash
bunx convex deploy
```
