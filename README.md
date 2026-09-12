# Ivy Homes property browser

A MERN-style full-stack app for the Ivy Homes assignment: React/Vite provides
the browser UI and Express is a backend-for-frontend that keeps the API key out
of the client bundle.

## Run locally

1. Copy `.env.example` to `.env` and set `IVY_API_KEY` to the issued key.
2. Run `npm install`, `npm install --prefix backend`, and `npm install --prefix frontend`.
3. Run `npm run dev`, then open `http://localhost:5173`.

The provided demo users can sign in. The browser retains the API session in
local storage; the server forwards the token and API key on every request.

## What was checked

The live API was sampled before implementation. Confirmed deviations from the
reference include API-key authentication (`X-API-Key`, not a query string), a
required bearer session for listings, access/refresh login tokens that expire
after 900 seconds, and offset-based response metadata (`limit`, `offset`,
`count`, `has_more`) rather than page metadata. The UI uses this observed
contract and shows server error messages.

`scripts/analyze.mjs` is the reproducible data pull. It pages every endpoint to
`has_more: false`, writes ignored local extracts to `data/`, and is run as:

```powershell
$env:IVY_API_KEY='your-issued-key'
$env:IVY_DEMO_PASSWORD='your-demo-password'
node scripts/analyze.mjs
```

The completed `submission.json` contains the calculated answers and only
findings reproduced against the issued Hyderabad key. Confirmed good behavior:
`/health` responds without authentication, returns an explicit
`Asia/Kolkata` clock, and documented `bhk` and locality filters do narrow
listing results. The analyzer uses the supplied IST reference boundary for the
seven-day answer.

With two more days I would add server-side cached analysis jobs, saved-listing
filtering in the Saved tab, client tests around session refresh and filter
behavior, plus accessibility and responsive visual regression tests.
