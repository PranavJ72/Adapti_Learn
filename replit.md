# Adaptilearn

Adaptilearn is an adaptive Computer Science Fundamentals learning workspace that adjusts explanations, practice, and remediation to each learner's mastery, interests, and friction signals.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `supabase/schema.sql` — idempotent Supabase schema and demo learner seed
- Required integration: the connected Supabase connector; no database URL or key is stored in the app

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB/backend: Supabase Postgres via the Replit Supabase connector and PostgREST
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/adaptilearn` — React/Vite learner dashboard with routes for overview, lessons, skill tree, and profile.
- `artifacts/api-server/src/routes/learner.ts` — learner dashboard, lesson generation, attempts, friction, profile, and diagnostic endpoints.
- `lib/api-spec/openapi.yaml` — source of truth for the API contract and generated client hooks.
- `lib/db/src/index.ts` — typed Supabase REST repository for users, concepts, knowledge state, and learning logs.
- `supabase/schema.sql` — Supabase tables, relationships, and first-run demo seed.
- `artifacts/adaptilearn/src/index.css` — shared Adaptilearn theme, typography, motion, and responsive styling.

## Architecture decisions

- The first learner is a seeded demo profile so the product has a complete first-run experience without local authentication.
- Adaptive lesson generation is server-side and deterministic in the first build, with a fallback source marker ready for an LLM provider later.
- The API contract is OpenAPI-first; generated React Query hooks are the only frontend API surface.
- Knowledge state is tracked per concept, so an incorrect answer lowers one micro-node and returns a remediation action instead of resetting the whole course.

## Product

- Learner dashboard with course progress, active concept, skill snapshot, insights, and recent activity.
- Interest-based lesson reader with analogy, key points, code trace, assessment checkpoint, immediate feedback, and 45-second remediation.
- Skill tree showing prerequisite-aware mastery status.
- Profile preferences and a three-question onboarding diagnostic.
- Proactive friction helper endpoint for answer switching, idle time, and hint requests.

## User preferences

No additional preferences recorded.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before using the generated hooks.
- Run `supabase/schema.sql` once in the connected Supabase project's SQL editor before opening the learner dashboard.
- The API server expects the seeded demo row with id `1` for the first-build learner experience.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
