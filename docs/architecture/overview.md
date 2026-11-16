# Architecture Overview

The Bible study platform follows a modern, scalable 3-layer architecture:

## 1. Frontend Layer (SvelteKit)
- **Responsibilities:** Routing, state management, UI rendering, user interactions.
- **Tools:** Svelte 5, SvelteKit, TailwindCSS v4.
- **Features:** Server-Side Rendering (SSR) for initial load performance, static site generation (SSG) for static content, and client-side navigation.

## 2. API Layer (NestJS)
- **Responsibilities:** Authentication, business logic, AI orchestration, validation, caching.
- **Tools:** NestJS, TypeScript, BullMQ.
- **Features:** REST API endpoints (Swagger at `/api/docs`) and queue management for long-running AI tasks; the client follows AI jobs by polling.

## 3. Data Layer (PostgreSQL + Redis)
- **Responsibilities:** Persistent data storage, caching, job queues.
- **Tools:** PostgreSQL 16 (Relational DB, Row-Level Security), Drizzle ORM, Redis 7 (BullMQ queues).
- **Features:** Structured storage for bible texts and user notes, fast caching of AI results, robust task queuing with BullMQ.
