---
name: dypai-sdk
description: Build apps with the DYPAI Client SDK. Use when wiring frontend or server code to DYPAI auth, endpoints, file upload/download flows, or users. Prefer project discovery via DYPAI MCP/docs before inventing endpoint or auth flows.
metadata:
  author: dypai
  version: "1.1"
---

# DYPAI Client SDK

## Purpose

Use this skill when implementing or reviewing app code that calls DYPAI through `@dypai-ai/client-sdk`.

This skill is intentionally short:

- Keep core SDK guidance here.
- Treat `dypai-mcp/docs` and live project state as the source of truth for endpoint/auth behavior.
- Do not invent auth or endpoint flows if the project can be inspected first.

## First Principles

Before proposing or writing SDK code:

1. Inspect the project with DYPAI tools/docs first.
2. Prefer existing endpoint names, auth modes, and workflow patterns over assumptions.
3. If auth or endpoint behavior is unclear, inspect before coding.

Prefer this order:

1. Project state via DYPAI MCP tools
2. `dypai-mcp/docs`
3. This skill

If they conflict, trust the real project state first.

## Recommended Agent Workflow

When implementing DYPAI SDK logic, do this in order:

1. Inspect DYPAI project state first via MCP tools.
2. Check the app codebase for an existing DYPAI client, auth routes, and env usage before creating new files or helpers.
3. Verify whether `@dypai-ai/client-sdk` is already installed in `package.json` before suggesting imports or installation.
4. If the SDK is missing, add it with the project's actual package manager (`npm`, `pnpm`, `yarn`, or `bun`) instead of inventing commands.
5. Reuse existing endpoint names, auth modes, and callback routes when they already exist.

Minimum things to inspect before implementing:

- dependency entry for `@dypai-ai/client-sdk`
- existing `createClient(...)` helper or shared SDK module
- auth pages/routes such as `login`, `register`, `auth/callback`, `forgot-password`, `reset-password`, `set-password`
- current env variable conventions for browser vs server-only code
- DYPAI endpoint auth mode (`jwt` vs `api_key`)

## Mandatory Tool Usage

Do not rely only on this skill from memory.

Before proposing SDK architecture, auth flows, endpoint names, or setup steps:

1. Use DYPAI MCP tools to inspect the real project state when available.
2. Search `dypai-mcp/docs` for the relevant topic instead of guessing from prior patterns.
3. Prefer tool-based discovery over assumptions, especially for:
   - endpoint existence
   - endpoint `auth_mode`
   - available workflow nodes
   - auth flow expectations
   - SDK setup details already documented

If the project can be inspected, inspect first. Do not invent the answer when DYPAI tools or docs can confirm it.

## Auth Rules

There are only two application-facing auth modes for HTTP endpoints:

- `jwt`: user session required
- `api_key`: project API key required

Important:

- Do not design or suggest public unauthenticated endpoints.
- Do not suggest `service_role` for app developers, frontend flows, or MCP-created endpoints.
- Treat `api_key` as server-only unless the project explicitly documents otherwise.

Use `jwt` when:

- The request is tied to a signed-in user
- The workflow uses `current_user`, `current_user_id`, or role-based access
- The request originates from browser/client UI

Use `api_key` when:

- The call is server-to-server
- The request comes from a Server Component, Route Handler, Server Action, backend, worker, or cron
- No user context is needed

Never recommend:

- putting project API keys in browser code
- using `NEXT_PUBLIC_*`, `VITE_*`, or similar public env vars for server-only keys
- sending `user_id` manually in request bodies when JWT context should provide it

## Setup

Install:

```bash
npm install @dypai-ai/client-sdk
```

Minimal client with user auth:

```typescript
import { createClient } from '@dypai-ai/client-sdk';

export const dypai = createClient('https://your-project.dypai.app');
```

Client that also targets `api_key` endpoints:

```typescript
export const dypai = createClient(
  process.env.DYPAI_URL!,
  process.env.DYPAI_API_KEY
);
```

Use server-only env vars for `api_key` where possible.

With options:

```typescript
const dypai = createClient(url, key, {
  auth: {
    storage: customMemoryStorage, // SSR/Node.js: custom storage adapter
    autoRefreshToken: true,       // default: true
    persistSession: true,         // default: true
    storageKey: 'my-app'          // isolate localStorage between clients
  },
  global: {
    fetch: customFetch,           // custom fetch implementation
    headers: { 'X-Custom': 'val' }
  },
  storageKey: 'my-app'            // shortcut for auth.storageKey
});
```

With TypeScript generics:

```typescript
interface MyDB {
  productos: { id: string; nombre: string; precio: number };
}

interface MyApi extends EndpointMap {
  'listar_productos': { response: Product[]; params: { limit?: number } };
  'crear_pedido': { body: CreateOrderInput; response: Order };
}

const dypai = createClient<MyDB, MyApi>(url, key);
```

## Core SDK Surface

Use these as the default primitives:

- Auth:
  - `dypai.auth.signInWithPassword(...)`
  - `dypai.auth.signInWithOtp(...)`
  - `dypai.auth.verifyOtp(...)`
  - `dypai.auth.signInWithOAuth(...)`
  - `dypai.auth.signOut()`
  - `dypai.auth.getSession()`
  - `dypai.auth.getUser()` / `dypai.me()`
  - `dypai.auth.onAuthStateChange(...)`
- API:
  - `dypai.api.get(name, { params })`
  - `dypai.api.post(name, body)`
  - `dypai.api.put(name, body)`
  - `dypai.api.patch(name, body)`
  - `dypai.api.delete(name)`
- Files via endpoints:
  - `dypai.api.upload(name, file, { params, onProgress })`
  - `dypai.api.download(name, body?, { fileName, params })`
  - `dypai.api.post(name, body)` for signed URLs or file actions
  - `dypai.api.delete(name, { params })`
- Users:
  - `dypai.users.list(...)`
  - `create(...)`
  - `update(...)`
  - `delete(...)`

## Response Pattern

Every method returns `{ data, error }` — never throws.

```typescript
const { data, error } = await dypai.api.post('create_task', { title: 'New' });

if (error) {
  // error.message, error.status, error.code, error.details
  console.error(`[${error.status}] ${error.message}`);
  return;
}

// data is typed and safe to use
console.log(data);
```

## Mandatory Discovery Before Auth Or Endpoint Design

If the task touches endpoint auth, API flows, or SDK integration:

1. Check DYPAI MCP tools first for existing endpoints and node capabilities.
2. Read the relevant docs in `dypai-mcp/docs`.
3. Reuse existing endpoint names and auth modes when possible.

Do this before proposing:

- signup/login flows
- route protection strategy
- server-vs-client API calling patterns
- storage endpoint design
- workflow endpoint conventions

## Fundamental Gotchas

1. **No public endpoints.** Do not assume unauthenticated endpoint access exists.
2. **`api_key` is not the default browser path.** Prefer `jwt` for client UI.
3. **Do not expose privileged keys.** Never suggest `service_role` in app code.
4. **Do not send `user_id` in the request body.** The backend should derive user context from JWT.
5. **There are no automatic CRUD REST endpoints.** Endpoints must exist first in API Builder or MCP.
6. **Endpoint names are logical names, not full URLs.**
7. **Use `getSession()` for reliable startup auth checks.** `isLoggedIn()` is sync and can be false during init.
8. **File handling is endpoint-based.** Do not suggest `dypai.storage`; use `dypai.api.upload()` / `dypai.api.download()` or endpoint calls instead.

## Recommended Patterns

Browser / authenticated app:

```typescript
const dypai = createClient(process.env.NEXT_PUBLIC_DYPAI_URL!);
const { data: session } = await dypai.auth.getSession();
const { data, error } = await dypai.api.get('get_profile');
```

Server / `api_key` endpoint:

```typescript
const dypai = createClient(
  process.env.DYPAI_URL!,
  process.env.DYPAI_API_KEY
);

const { data, error } = await dypai.api.post('sync_data', payload);
```

Files via endpoints:

```typescript
const { data, error } = await dypai.api.upload('storage_files', file, {
  params: { operation: 'upload', file_path: `invoices/${file.name}` }
});
```

## API Endpoints

Endpoint names use `snake_case`.

```typescript
const { data } = await dypai.api.get('search_products', {
  params: { category: 'food', limit: 20 }
});

const { data: created } = await dypai.api.post('create_invoice', {
  client_id: 'uuid',
  items: [{ product_id: 'uuid', qty: 2 }]
});
```

## SDK-Specific Must-Knows

- `signInWithOAuth()` redirects the browser and the session is recovered on return.
- `signUp()` may return `confirmationRequired` instead of an immediate session.
- OTP verification requires the correct `type`.
- `dypai.users.*` is admin-oriented and should not be treated as normal browser-safe user functionality.

## File Upload Pattern

Use workflow endpoints that call `dypai_storage` on the backend.

Common patterns:

- Generic file endpoint such as `storage_files` for upload/list/delete
- Dedicated download endpoint when access must be validated with SQL first
- `dypai.api.upload()` for browser uploads
- `dypai.api.download()` or `dypai.api.post()` for downloads / signed URLs

Recommended endpoint node:

```json
{
  "node_type": "dypai_storage",
  "parameters": {
    "operation": "${input.operation}",
    "bucket": "documents"
  }
}
```

Then call it from the SDK:

```typescript
await dypai.api.upload('storage_files', file, {
  params: { operation: 'upload', file_path: `documents/${file.name}` }
});
```

For user-facing downloads, prefer a dedicated endpoint that validates ownership before generating the signed URL.

## Extra References

Use these for detailed guidance when needed:

- `dypai-mcp/docs/trigger-model.md`
- `dypai-mcp/docs/workflow-patterns.md`
- `dypai-mcp/docs/sdk-reference.md`
- `dypai-mcp/docs/credentials-reference.md`
