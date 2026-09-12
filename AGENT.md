# Ivy Homes assignment guide

## Product goal
Build a dependable property browser over the live Ivy Homes API. The server, not
the old API reference, is the source of truth. Keep the API key on the server.

## Architecture
- `server/` is an Express BFF. It forwards `X-API-Key` and bearer tokens to Ivy.
- `client/` is a React/Vite SPA. It only calls `/api/*` and stores the session
  locally so a refresh keeps the user signed in.
- Use observed `limit`, `offset`, `count`, `total`, `has_more` pagination.

## Quality bar
- Do not commit `.env` or live tokens.
- Use `npm run dev` for local development and `npm run build` before handoff.
- Surface API error messages; never silently pretend a failed filter worked.
- Record confirmed documentation mismatches in `submission.json` and README.
