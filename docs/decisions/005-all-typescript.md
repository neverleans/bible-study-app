# ADR 005 - All TypeScript

**Date:** 2026-09-27
**Status:** Accepted

## Context
To maximize code reuse and developer productivity, we want a unified language across the stack.

## Decision
Use strict TypeScript in both frontend and backend.

## Consequences
- **Pros:** Shared types (API contracts, DTOs), single toolchain (Node/pnpm), fewer context switches for full-stack developers.
- **Cons:** Build steps required before execution, type definitions can sometimes be complex.
