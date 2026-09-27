# ADR 003 - PostgreSQL

**Date:** 2026-09-27
**Status:** Accepted

## Context
We need a robust, scalable relational database to store users, notes, and the Bible text.

## Decision
Use PostgreSQL 16.

## Consequences
- **Pros:** ACID compliant, excellent JSON support (useful for verses and AI cache), highly scalable, large community.
- **Cons:** Requires schema management (which we will handle with Prisma).
