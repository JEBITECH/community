# Postman Collection

`Community_App_API.postman_collection.json` covers every HTTP endpoint across all three backend services — auth-svc, community-svc, and notification-svc — reached through the gateway. 153 requests across 21 folders.

## Setup

1. Import both files into Postman: the collection and `Community_App_Local.postman_environment.json`.
2. Select the "Community App - Local" environment, and set `baseUrl` to wherever the gateway is actually running (defaults to `http://localhost:4000`; use `https://eoorai.com` for the deployed droplet).
3. Confirm `masterAdminEmail`/`masterAdminPassword` in the environment (defaults match the seeded local dev admin).
4. Run **Auth > Login** once. Its test script captures `accessToken` into a collection variable — every other request inherits it automatically as a Bearer token, since the gateway derives all the internal `x-user-*` headers from that JWT itself.

## Notes

- **Public (Guest)** folders need no auth at all — these are the endpoints the gateway's JWT guard allowlists (guest event browsing, guest donations/sponsorships/RSVPs).
- **Notifications / Internal (Service-to-Service)** endpoints require a separate `x-internal-service-token` header (set `internalServiceKey` in the environment to match that service's `INTERNAL_SERVICE_KEY` env var) — these represent service-to-service calls, not normally reached through the public-facing gateway in real usage.
- Most create/list requests auto-capture IDs (`organizationId`, `eventId`, `participationId`, ...) into collection variables via test scripts, so folders can generally be run top-to-bottom without manually copying IDs between requests.
- Generated from a full read of every controller/DTO in the codebase, not the OpenAPI/Swagger output — cross-check against `docs/BACKLOG.md`-noted gaps if an endpoint's behavior looks off; a couple of auth-svc routes referenced in older code paths (`register`, token-verify) are dead code with no actual HTTP route and were intentionally left out.
