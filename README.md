# ESANA Rider Delivery

A mobile-first React web app for restaurant-owned ESANA riders. The implementation follows the Rider Web App screens in the supplied Oensys V3 Figma file and the ESANA MVP Rider App requirements.

## Included flow

- Rider-only sign in with optional remembered access and protected routes
- Forgot-password email request, single-use reset link, and new-password confirmation
- Active deliveries limited to the signed-in rider's `DISPATCHED` orders
- Completed delivery history
- Read-only order, customer, address, instructions, and payment details
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

In mock mode, requesting a reset for the demo email reveals an **Open demo reset link** button in place of an actual email. Production mode expects the server to email that link. A successful reset changes the demo password until the site's local storage is cleared.

**Remember me** stores the rider session and email in local storage. Without it, the session is kept only for the current browser tab.

Reset the full demo by clearing the site's local and session storage.

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
| `POST` | `/auth/rider/password-reset/request` | Email a password reset link |
| `POST` | `/auth/rider/password-reset/confirm` | Validate the link token and save the new password |
| `GET` | `/rider/deliveries?status=active\|completed` | List the rider's permitted deliveries |
| `GET` | `/rider/deliveries/:id` | Read one assigned delivery |
| `POST` | `/rider/deliveries/:id/deliver` | Revalidate and mark delivered |

Authentication, OTP, lockout, permission checks, audit history, restaurant updates, and WhatsApp delivery notifications remain server responsibilities. The mock adapter models the rider-facing success and error states but is not a substitute for those production controls.

## Typography

The Figma design uses Lufga. The CSS uses the locally installed `Lufga` family first and provides system fallbacks. Do not commit proprietary font files unless the project has an appropriate web-font licence; licensed `.woff2` files can be added later with `@font-face`.
