# ADR 004 - Redis + BullMQ

**Date:** 2026-09-27
**Status:** Accepted

## Context
Generating AI content takes time. We cannot block API requests while waiting for the Gemini API. We also need to cache frequent queries.

## Decision
Use Redis 7 for caching and BullMQ for background task processing.

## Consequences
- **Pros:** Reliable queue system, easy horizontal scaling of workers, fast in-memory caching.
- **Cons:** Additional infrastructure dependency.
