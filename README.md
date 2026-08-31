# ESANA Rider Delivery

A mobile-first React web app for restaurant-owned ESANA riders. The implementation follows the Rider Web App screens in the supplied Oensys V3 Figma file and the ESANA MVP Rider App requirements.

## Included flow

- Rider-only sign in and protected routes
- Active deliveries limited to the signed-in rider's `DISPATCHED` orders
- Completed delivery history
- Read-only order, customer, address, instructions, payment, and route details
- External Google Maps handoff from the route preview
- Confirmation before marking an order as delivered
- Assignment and status revalidation before saving
- One-time `DISPATCHED` → `DELIVERED` transition
- Success feedback, completed-list movement, persisted state, and logout
- Responsive 390 px mobile design and installable web-app manifest

## Run locally

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`.

Demo rider credentials:

```text
rider@esana.com
Rider123!
```

Reset the demo by clearing the site's local storage.

## Quality checks

```bash
pnpm test
pnpm build
```

## Connect the ESANA API

The UI talks only to the typed `RiderApi` contract in `src/services/riderApi.ts`. Mock mode is the default. Copy `.env.example` to `.env` and configure:

```text
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://your-esana-api.example.com
```

The included HTTP adapter expects:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/rider/login` | Return a `RiderSession` |
| `POST` | `/auth/logout` | End the current session |
| `GET` | `/rider/deliveries?status=active\|completed` | List the rider's permitted deliveries |
| `GET` | `/rider/deliveries/:id` | Read one assigned delivery |
| `POST` | `/rider/deliveries/:id/deliver` | Revalidate and mark delivered |

Authentication, OTP, lockout, permission checks, audit history, restaurant updates, and WhatsApp delivery notifications remain server responsibilities. The mock adapter models the rider-facing success and error states but is not a substitute for those production controls.

## Typography

The Figma design uses Lufga. The CSS uses the locally installed `Lufga` family first and provides system fallbacks. Do not commit proprietary font files unless the project has an appropriate web-font licence; licensed `.woff2` files can be added later with `@font-face`.
