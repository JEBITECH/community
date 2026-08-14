# Cross-Origin Domain Whitelisting — Manual Verification Guide

This document describes how to manually verify the end-to-end cross-origin flow for the booking widget domain whitelisting feature.

## Prerequisites

- Access to the ERP PostgreSQL database
- The gateway service running (default: `http://localhost:3000`)
- The booking-engine-svc running (default: `http://localhost:3010`)
- A valid `INTERNAL_SERVICE_KEY` configured in the environment
- A test organization UUID from the `organization` table

---

## Step 1: Set Up a Test Client Domain

### Option A: Direct Database Update

Add `demo.bookings-flow.com` to an organization's `allowed_domains` column:

```sql
-- Add the bare domain
UPDATE organization 
SET allowed_domains = array_append(allowed_domains, 'demo.bookings-flow.com')
WHERE uuid = '<your-test-org-uuid>';

-- Also add the https:// origin form (browsers send full origin with protocol)
UPDATE organization 
SET allowed_domains = array_append(allowed_domains, 'https://demo.bookings-flow.com')
WHERE uuid = '<your-test-org-uuid>';
```

Verify the update:

```sql
SELECT uuid, allowed_domains 
FROM organization 
WHERE uuid = '<your-test-org-uuid>';
```

### Option B: Use the PATCH API Endpoint

Use the internal service endpoint to add the domain programmatically:

```bash
curl -X PATCH http://localhost:3010/api/auth/organizations/<org-uuid>/allowed-domains \
  -H "Content-Type: application/json" \
  -H "x-internal-service-token: <your-INTERNAL_SERVICE_KEY>" \
  -d '{"addDomains": ["demo.bookings-flow.com", "https://demo.bookings-flow.com"]}'
```

Expected response: `200 OK` with the updated organization or a success confirmation.

---

## Step 2: Verify CORS Preflight (OPTIONS Request)

Send a CORS preflight request simulating a browser from the test domain:

```bash
curl -X OPTIONS http://localhost:3000/api/bookings/auth/generate-public-access-token \
  -H "Origin: https://demo.bookings-flow.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

### Expected Response Headers

| Header | Expected Value |
|--------|---------------|
| `Access-Control-Allow-Origin` | `https://demo.bookings-flow.com` |
| `Access-Control-Allow-Credentials` | `true` |
| `Access-Control-Allow-Methods` | includes `POST` |
| `Access-Control-Allow-Headers` | includes `Content-Type` |

**Important:** The `Access-Control-Allow-Origin` value must be the exact origin string, never `*`.

---

## Step 3: Verify Token Generation (POST Request)

Make an actual token generation request:

```bash
curl -X POST http://localhost:3000/api/bookings/auth/generate-public-access-token \
  -H "Origin: https://demo.bookings-flow.com" \
  -H "Content-Type: application/json" \
  -d '{"organizationId": "<your-test-org-uuid>"}' \
  -v
```

### Expected Response Headers

| Header | Expected Value |
|--------|---------------|
| `Access-Control-Allow-Origin` | `https://demo.bookings-flow.com` |
| `Access-Control-Allow-Credentials` | `true` |
| `Set-Cookie` | includes `public-access-token=...; SameSite=None; Secure` (in production mode) |

In development mode, the cookie will have `SameSite=Lax` instead.

---

## Step 4: Verify Cookie is Sent on Subsequent Requests

Extract the `public-access-token` cookie from the Step 3 response, then make a follow-up request:

```bash
curl -X POST http://localhost:3000/api/bookings/auth/validate-public-access-token \
  -H "Origin: https://demo.bookings-flow.com" \
  -H "Cookie: public-access-token=<token-value-from-step-3>" \
  -v
```

### Expected Behavior

- The request succeeds (200 OK or appropriate success response)
- The `Access-Control-Allow-Origin` header is still `https://demo.bookings-flow.com`
- The `Access-Control-Allow-Credentials` header is `true`

---

## Step 5: Verify Admin Dashboard Domain Sync

1. Log into the admin dashboard
2. Navigate to **Settings** → **Site Settings**
3. Change the `siteDomain` field to a new value (e.g., `test-client.example.com`)
4. Save the settings

Then verify the domain was synced:

```sql
SELECT uuid, allowed_domains 
FROM organization 
WHERE uuid = '<your-org-uuid>';
```

The `allowed_domains` array should now include:
- `test-client.example.com`
- `https://test-client.example.com`

And the previous domain (if changed) should be removed.

---

## Step 6: Verify Unlisted Domain is Rejected

Send a preflight request from a domain that is NOT in any organization's `allowed_domains`:

```bash
curl -X OPTIONS http://localhost:3000/api/bookings/auth/generate-public-access-token \
  -H "Origin: https://malicious-site.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Expected Behavior

- The response does NOT include an `Access-Control-Allow-Origin` header
- The browser would block the actual request from this origin

---

## Step 7: Verify Platform Domains Always Work

Platform domains should always be allowed regardless of organization configuration:

```bash
curl -X OPTIONS http://localhost:3000/api/bookings/auth/generate-public-access-token \
  -H "Origin: https://admin.virtueinspect.com" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Expected Response

- `Access-Control-Allow-Origin: https://admin.virtueinspect.com`
- `Access-Control-Allow-Credentials: true`

This should work without any database entries because `*.virtueinspect.com` is a platform domain.

---

## Cleanup

After verification, remove the test domain:

```sql
UPDATE organization 
SET allowed_domains = array_remove(allowed_domains, 'demo.bookings-flow.com')
WHERE uuid = '<your-test-org-uuid>';

UPDATE organization 
SET allowed_domains = array_remove(allowed_domains, 'https://demo.bookings-flow.com')
WHERE uuid = '<your-test-org-uuid>';
```

Or via the API:

```bash
curl -X PATCH http://localhost:3010/api/auth/organizations/<org-uuid>/allowed-domains \
  -H "Content-Type: application/json" \
  -H "x-internal-service-token: <your-INTERNAL_SERVICE_KEY>" \
  -d '{"removeDomains": ["demo.bookings-flow.com", "https://demo.bookings-flow.com"]}'
```

---

## Troubleshooting

| Symptom | Likely Cause |
|---------|-------------|
| No `Access-Control-Allow-Origin` header | Domain not in `allowed_domains` or cache stale (wait 60s) |
| `SameSite=Lax` in production | `NODE_ENV` not set to `production` |
| Domain sync not working | `DOMAIN_WHITELIST_SYNC_URL` not configured in bookings-studio env |
| PATCH endpoint returns 401/403 | Invalid or missing `x-internal-service-token` header |
| Cookie not sent on subsequent requests | Browser blocking due to missing `SameSite=None; Secure` |
