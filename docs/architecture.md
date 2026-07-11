# AegisIQ Architecture

## Overview

AegisIQ is an Enterprise Industrial Decision Intelligence Platform with layered clean architecture, polyglot persistence, and a modern React frontend.

## System Diagram

```
┌─────────────────────┐      ┌─────────────────────┐
│   Next.js 15 App    │      │   FastAPI Backend   │
│   (App Router)      │◄────►│   (Clean Arch)      │
│   React Query       │ HTTP │   Service Layer     │
│   shadcn/ui         │  WS  │   Repository Layer  │
└─────────────────────┘      └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
               ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
               │PostgreSQL│         │  Neo4j  │         │  Qdrant │
               │(Relational)│       │ (Graph) │         │(Vector) │
               └─────────┘         └─────────┘         └─────────┘
                    │                    │                    │
               ┌────▼────┐                                   │
               │  Redis  │◄──────────────────────────────────┘
               │(Cache,  │
               │ Sessions)│
               └─────────┘
```

## Backend Layers

- **api/** — Thin controllers that parse requests and delegate to services
- **services/** — Business logic orchestration
- **repositories/** — Data access abstraction (SQLAlchemy)
- **integrations/** — External system clients (Neo4j, Qdrant, Redis, CV)
- **core/** — Cross-cutting concerns (config, security, middleware)

## Frontend Structure

- **app/** — Next.js App Router pages and layouts
- **components/ui/** — shadcn/ui primitives
- **components/layout/** — App shell (Sidebar, Header)
- **features/** — Feature modules: components, hooks, queries, types
- **lib/** — Shared utilities (API client, auth, utils)

## Key Decisions

| Decision | Rationale |
|---|---|
| Repository pattern | Single point of change for data access |
| Service isolation | Business logic testable without API layer |
| Polyglot persistence | Each database optimized for its workload |
| JWT + opaque refresh | Stateless access, revocable refresh |
| Feature-based frontend | Co-located, self-contained feature modules |
