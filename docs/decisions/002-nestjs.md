# ADR 002 - NestJS

**Date:** 2026-09-27
**Status:** Accepted

## Context
The API needs to handle complex business logic, background jobs for AI processing, and real-time updates.

## Decision
Use NestJS for the API backend.

## Consequences
- **Pros:** Strong architectural patterns (DI, modules), excellent TypeScript support, built-in support for WebSockets and queues.
- **Cons:** Boilerplate can be heavy for simple endpoints, steeper learning curve.
