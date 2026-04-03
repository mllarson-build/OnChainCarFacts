# TODOS

## Sentry error monitoring
Add @sentry/node (API) + @sentry/react (frontend) for error tracking before HN/Reddit launch in week 4. Free tier covers MVP. Without this, you're flying blind when traffic hits.
**Depends on:** API + frontend scaffolding.

## Contract version resolution in verify endpoint
Store historical contract addresses in config. Verify endpoint checks each address (newest first) until anchor found. Needed if contract is ever redeployed. One contract version for now, but the design doc commits to immutable contracts with versioned deployments.
**Depends on:** Contract deploy + verify endpoint.

## Split batch anchor worker to separate Railway service
Currently runs in-process via node-cron. If traffic grows or anchor txs get slow, split to a dedicated Railway service with its own health check. Document Redis migration path for rate limiting at the same time.
**Depends on:** Batch anchor worker implementation.

## VIN watch notifications (email/SMS)
After a buyer looks up a VIN, offer to notify them when new records are added. Captures buyer intent (email = warm lead for premium), creates feedback loop (buyer knows when seller adds records), builds remarketing list. Requires: email input on VIN report page, notifications table, email sender (Resend or SendGrid free tier).
**Why deferred:** Adds email infrastructure complexity. Build after Phase 0 validates demand.
**Depends on:** VIN report page + API routes.
**Effort:** M (human: ~3 days / CC: ~20 min)
